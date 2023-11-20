import {defineCustomElement} from '../../common/init';
import {StoreMetadata} from '../../common/utils/types';
import Bugsnag from '../../common/bugsnag';
import {IFrameEventSource} from '../../common/MessageEventSource';
import MessageListener from '../../common/MessageListener';
import {ShopSheetModal} from '../../common/shop-sheet-modal/shop-sheet-modal';
import {
  PAY_AUTH_DOMAIN,
  PAY_AUTH_DOMAIN_ALT,
  SHOP_WEBSITE_DOMAIN,
  validateStorefrontOrigin,
} from '../../common/utils/urls';
import {I18n} from '../../common/translator/i18n';
import {
  exchangeLoginCookie,
  getAnalyticsTraceId,
  getCookie,
  getStoreMeta,
  isMobileBrowser,
  updateAttribute,
  ShopHubTopic,
} from '../../common/utils';
import ConnectedWebComponent from '../../common/ConnectedWebComponent';
import {
  sheetModalBuilder,
  SheetModalManager,
} from '../../common/shop-sheet-modal/shop-sheet-modal-builder';
import {
  AuthorizeState,
  LoginButtonCompletedEvent as CompletedEvent,
  LoginButtonMessageEventData as MessageEventData,
  OAuthParams,
  ShopActionType,
  LoginButtonVersion as Version,
} from '../../types';
import {
  ATTRIBUTE_CLIENT_ID,
  ATTRIBUTE_STOREFRONT_ORIGIN,
  ATTRIBUTE_VERSION,
  ERRORS,
  LOAD_TIMEOUT_MS,
  ATTRIBUTE_DEV_MODE,
  ATTRIBUTE_ANALYTICS_TRACE_ID,
} from '../../constants/loginButton';
import {
  createGetAppButtonHtml,
  createScanCodeTooltipHtml,
  SHOP_FOLLOW_BUTTON_HTML,
} from '../../constants/followButton';

import {FollowOnShopMonorailTracker} from './analytics';
import {createModalContent, ModalContent} from './components/modal-content';
import {buildAuthorizeUrl} from './authorize';
import {
  createFollowButton,
  FollowOnShopButton,
} from './components/follow-on-shop-button';
import {createStoreLogo, StoreLogo} from './components/store-logo';

enum ModalOpenStatus {
  Closed = 'closed',
  Mounting = 'mounting',
  Open = 'open',
}

export const COOKIE_NAME = 'shop_followed';

export default class ShopFollowButton extends ConnectedWebComponent {
  #rootElement: ShadowRoot;
  #analyticsTraceId = getAnalyticsTraceId();
  #clientId = '';
  #version: Version = '2';
  #storefrontOrigin = window.location.origin;
  #devMode = false;
  #monorailTracker = new FollowOnShopMonorailTracker({
    elementName: 'shop-follow-button',
    analyticsTraceId: this.#analyticsTraceId,
  });

  #buttonInViewportObserver: IntersectionObserver | undefined;

  #followShopButton: FollowOnShopButton | undefined;
  #isFollowing = false;
  #storefrontMeta: StoreMetadata | null = null;

  #iframe: HTMLIFrameElement | undefined;
  #iframeListener: MessageListener<MessageEventData> | undefined;
  #iframeLoadTimeout: ReturnType<typeof setTimeout> | undefined;

  #authorizeModalManager: SheetModalManager | undefined;
  #followModalManager: SheetModalManager | undefined;

  #authorizeModal: ShopSheetModal | undefined;
  #authorizeLogo: StoreLogo | undefined;
  #authorizeModalContent: ModalContent | undefined;
  #authorizeModalOpenedStatus: ModalOpenStatus = ModalOpenStatus.Closed;
  #followedModal: ShopSheetModal | undefined;
  #followedModalContent: ModalContent | undefined;
  #followedTooltip: HTMLDivElement | undefined;

  #i18n: I18n | null = null;

  static get observedAttributes(): string[] {
    return [
      ATTRIBUTE_CLIENT_ID,
      ATTRIBUTE_VERSION,
      ATTRIBUTE_STOREFRONT_ORIGIN,
      ATTRIBUTE_DEV_MODE,
    ];
  }

  constructor() {
    super();

    this.#rootElement = this.attachShadow({mode: 'open'});
    this.#isFollowing = getCookie(COOKIE_NAME) === 'true';
  }

  #handleUserIdentityChange = () => {
    this.#updateSrc(true);
  };

  attributeChangedCallback(
    name: string,
    _oldValue: string,
    newValue: string,
  ): void {
    switch (name) {
      case ATTRIBUTE_VERSION:
        this.#version = newValue as Version;
        this.#updateSrc();
        break;
      case ATTRIBUTE_CLIENT_ID:
        this.#clientId = newValue;
        this.#updateSrc();
        break;
      case ATTRIBUTE_STOREFRONT_ORIGIN:
        this.#storefrontOrigin = newValue;
        validateStorefrontOrigin(this.#storefrontOrigin);
        break;
      case ATTRIBUTE_DEV_MODE:
        this.#devMode = newValue === 'true';
        this.#updateSrc();
        break;
    }
  }

  async connectedCallback(): Promise<void> {
    this.subscribeToHub(
      ShopHubTopic.UserStatusIdentity,
      this.#handleUserIdentityChange,
    );

    await this.#initTranslations();
    this.#initElements();
    this.#initEvents();
  }

  async #initTranslations() {
    try {
      // BUILD_LOCALE is used for generating localized bundles.
      // See ./scripts/i18n-dynamic-import-replacer-rollup.mjs for more info.
      // eslint-disable-next-line no-process-env
      const locale = process.env.BUILD_LOCALE || I18n.getDefaultLanguage();
      const dictionary = await import(`./translations/${locale}.json`);
      this.#i18n = new I18n({[locale]: dictionary});
    } catch (error) {
      if (error instanceof Error) {
        Bugsnag.notify(error);
      }
    }
    return null;
  }

  #initElements() {
    this.#followShopButton = createFollowButton(this.#isFollowing);
    this.#rootElement.innerHTML = SHOP_FOLLOW_BUTTON_HTML;
    this.#rootElement.appendChild(this.#followShopButton);
  }

  #initEvents() {
    this.#trackComponentLoadedEvent(this.#isFollowing);
    this.#trackComponentInViewportEvent();

    validateStorefrontOrigin(this.#storefrontOrigin);
    this.#followShopButton?.addEventListener('click', () => {
      // dev mode
      if (this.#devMode) {
        this.#isFollowing = !this.#isFollowing;
        this.#followShopButton?.setFollowing({
          following: this.#isFollowing,
        });
        return;
      }

      if (this.#isFollowing) {
        this.#monorailTracker.trackFollowingGetAppButtonPageImpression();

        if (isMobileBrowser()) {
          this.#createAndOpenAlreadyFollowingModal();
        } else {
          this.#createAlreadyFollowingTooltip();
        }
      } else {
        this.#monorailTracker.trackFollowButtonClicked();
        this.#createAndOpenFollowOnShopModal();
      }
    });
  }

  disconnectedCallback(): void {
    this.unsubscribeAllFromHub();
    this.#iframeListener?.destroy();
    this.#buttonInViewportObserver?.disconnect();
    this.#authorizeModalManager?.destroy();
    this.#followModalManager?.destroy();
  }

  #createAndOpenFollowOnShopModal() {
    if (this.#authorizeModal) {
      this.#authorizeModal.open();
      return;
    }

    this.#authorizeLogo = this.#createStoreLogo();
    this.#authorizeModalContent = createModalContent({});
    this.#authorizeModalContent.append(this.#createIframe());

    this.#authorizeModalManager = sheetModalBuilder()
      .withInnerHTML(SHOP_FOLLOW_BUTTON_HTML)
      .build();
    this.#authorizeModal = this.#authorizeModalManager.sheetModal;
    this.#authorizeModal.setAttribute(
      ATTRIBUTE_ANALYTICS_TRACE_ID,
      this.#analyticsTraceId,
    );
    this.#authorizeModal.appendChild(this.#authorizeLogo);
    this.#authorizeModal.appendChild(this.#authorizeModalContent);

    this.#authorizeModal.addEventListener(
      'modalcloserequest',
      this.#closeAuthorizeModal.bind(this),
    );

    this.#authorizeModalOpenedStatus = ModalOpenStatus.Mounting;
  }

  async #createAndOpenAlreadyFollowingModal() {
    if (!this.#followedModal) {
      this.#followModalManager = sheetModalBuilder()
        .withInnerHTML(SHOP_FOLLOW_BUTTON_HTML)
        .build();
      this.#followedModal = this.#followModalManager.sheetModal;
      this.#followedModal.setAttribute('disable-popup', 'true');
      const storeMeta = await this.#fetchStorefrontMetadata();
      const storeName = storeMeta?.name ?? 'the store';
      const title = this.#i18n?.translate(
        'follow_on_shop.following_modal.title',
        {store: storeName},
      );
      const description = this.#i18n?.translate(
        'follow_on_shop.following_modal.subtitle',
      );
      this.#followedModalContent = createModalContent(
        {
          title,
          description,
        },
        true,
      );
      this.#followedModal.appendChild(this.#followedModalContent);
      this.#followedModal.appendChild(
        await this.#createAlreadyFollowingModalButton(),
      );
      this.#followedModal.addEventListener('modalcloserequest', async () => {
        if (this.#followedModal) {
          await this.#followedModal.close();
        }
        this.#followShopButton?.setFocused();
      });

      if (title) {
        this.#followedModal.setAttribute('title', title);
      }
    }

    this.#followedModal.open();
    this.#monorailTracker.trackFollowingGetAppButtonPageImpression();
  }

  #createStoreLogo(): StoreLogo {
    const storeLogo = createStoreLogo();

    this.#fetchStorefrontMetadata()
      .then((storefrontMeta) => {
        storeLogo.update({
          name: storefrontMeta?.name || '',
          logoSrc: storefrontMeta?.id
            ? `${SHOP_WEBSITE_DOMAIN}/shops/${storefrontMeta.id}/logo?width=58`
            : '',
        });
      })
      .catch(() => {
        /** no-op */
      });

    return storeLogo;
  }

  #createIframe(): HTMLIFrameElement {
    this.#iframe = document.createElement('iframe');
    this.#iframe.tabIndex = 0;
    this.#updateSrc();

    const eventDestination: Window | undefined =
      this.ownerDocument?.defaultView || undefined;

    this.#iframeListener = new MessageListener<MessageEventData>(
      new IFrameEventSource(this.#iframe),
      [PAY_AUTH_DOMAIN, PAY_AUTH_DOMAIN_ALT, this.#storefrontOrigin],
      this.#handlePostMessage.bind(this),
      eventDestination,
    );

    updateAttribute(this.#iframe, 'allow', 'publickey-credentials-get *');

    return this.#iframe;
  }

  async #createAlreadyFollowingModalButton(): Promise<HTMLDivElement> {
    const buttonWrapper = document.createElement('div');
    const storeMeta = await this.#fetchStorefrontMetadata();
    const storeId = storeMeta?.id;

    const buttonText =
      this.#i18n?.translate('follow_on_shop.following_modal.continue', {
        defaultValue: 'Continue',
      }) ?? '';
    const buttonLink = storeId ? `https://shop.app/sid/${storeId}` : '#';
    buttonWrapper.innerHTML = createGetAppButtonHtml(buttonLink, buttonText);
    buttonWrapper.addEventListener('click', async () => {
      this.#monorailTracker.trackFollowingGetAppButtonClicked();
      this.#followedModal?.close();
    });
    return buttonWrapper;
  }

  async #createAlreadyFollowingTooltip() {
    if (!this.#followedTooltip) {
      this.#followedTooltip = document.createElement('div');
      this.#followedTooltip.classList.add('fos-tooltip', 'fos-tooltip-hidden');

      const storeMeta = await this.#fetchStorefrontMetadata();
      const storeName = storeMeta?.name ?? 'the store';
      const description =
        this.#i18n?.translate('follow_on_shop.following_modal.qr_header', {
          store: storeName,
        }) ?? '';
      const qrCodeAltText =
        this.#i18n?.translate('follow_on_shop.following_modal.qr_alt_text') ??
        '';
      const storeId = storeMeta?.id;
      const qrCodeUrl = storeId
        ? `${SHOP_WEBSITE_DOMAIN}/qr/sid/${storeId}`
        : `#`;
      this.#followedTooltip.innerHTML = createScanCodeTooltipHtml(
        description,
        qrCodeUrl,
        qrCodeAltText,
      );

      this.#followedTooltip
        .querySelector('.fos-tooltip-overlay')
        ?.addEventListener('click', () => {
          this.#followedTooltip?.classList.toggle('fos-tooltip-hidden', true);
        });
      this.#followedTooltip?.addEventListener('click', () => {
        this.#followedTooltip?.classList.toggle('fos-tooltip-hidden', true);
      });

      this.#rootElement.appendChild(this.#followedTooltip);
    }

    this.#followedTooltip.classList.toggle('fos-tooltip-hidden', false);
  }

  #updateSrc(forced?: boolean) {
    if (this.#iframe) {
      const oauthParams: OAuthParams = {
        clientId: this.#clientId,
      };
      const authorizeUrl = buildAuthorizeUrl({
        version: this.#version,
        analyticsTraceId: this.#analyticsTraceId,
        flow: ShopActionType.Follow,
        oauthParams,
      });

      this.#initLoadTimeout();
      updateAttribute(this.#iframe, 'src', authorizeUrl, forced);
      Bugsnag.leaveBreadcrumb('Iframe url updated', {authorizeUrl}, 'state');
    }
  }

  #initLoadTimeout() {
    this.#clearLoadTimeout();
    this.#iframeLoadTimeout = setTimeout(() => {
      const error = ERRORS.temporarilyUnavailable;
      this.dispatchCustomEvent('error', {
        message: error.message,
        code: error.code,
      });
      // eslint-disable-next-line no-warning-comments
      // TODO: replace this bugsnag notify with a Observe-able event
      // Bugsnag.notify(
      //   new PayTimeoutError(`Pay failed to load within ${LOAD_TIMEOUT_MS}ms.`),
      //   {component: this.#component, src: this.iframe?.getAttribute('src')},
      // );
      this.#clearLoadTimeout();
    }, LOAD_TIMEOUT_MS);
  }

  #clearLoadTimeout() {
    if (!this.#iframeLoadTimeout) return;
    clearTimeout(this.#iframeLoadTimeout);
    this.#iframeLoadTimeout = undefined;
  }

  #trackComponentLoadedEvent(isFollowing: boolean) {
    this.#monorailTracker.trackFollowButtonPageImpression(isFollowing);
  }

  #trackComponentInViewportEvent() {
    this.#buttonInViewportObserver = new IntersectionObserver((entries) => {
      for (const {isIntersecting} of entries) {
        if (isIntersecting) {
          this.#buttonInViewportObserver?.disconnect();
          this.#monorailTracker.trackFollowButtonInViewport();
        }
      }
    });

    this.#buttonInViewportObserver.observe(this.#followShopButton!);
  }

  async #fetchStorefrontMetadata() {
    if (!this.#storefrontMeta) {
      this.#storefrontMeta = await getStoreMeta(this.#storefrontOrigin);
    }

    return this.#storefrontMeta;
  }

  async #handleCompleted({
    loggedIn,
    shouldFinalizeLogin,
  }: Partial<CompletedEvent>) {
    const now = new Date();
    now.setTime(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    document.cookie = `${COOKIE_NAME}=true;expires=${now.toUTCString()};path=/`;

    if (loggedIn) {
      if (shouldFinalizeLogin) {
        exchangeLoginCookie(this.#storefrontOrigin, (error) => {
          Bugsnag.notify(new Error(error));
        });
      }

      this.publishToHub(ShopHubTopic.UserStatusIdentity);
    }

    await this.#authorizeLogo?.setFavorited();
    await this.#authorizeModal?.close();
    this.#iframeListener?.destroy();
    this.#followShopButton?.setFollowing({following: true});
    this.#isFollowing = true;
    this.#trackComponentLoadedEvent(true);
  }

  #handleError(code: string, message: string, email?: string): void {
    this.#clearLoadTimeout();

    this.dispatchCustomEvent('error', {
      code,
      message,
      email,
    });
  }

  async #handleLoaded({
    clientName,
    logoSrc,
  }: {
    clientName?: string;
    logoSrc?: string;
  }) {
    if (clientName || logoSrc) {
      this.#authorizeLogo!.update({
        name: clientName,
        logoSrc,
      });
    }

    if (this.#authorizeModalOpenedStatus === ModalOpenStatus.Mounting) {
      this.#authorizeModal!.open();
      this.#authorizeModalOpenedStatus = ModalOpenStatus.Open;
      this.#clearLoadTimeout();
    }
  }

  async #closeAuthorizeModal() {
    if (this.#authorizeModal) {
      await this.#authorizeModal.close();
    }
    this.#followShopButton?.setFocused();
  }

  #handlePostMessage(data: MessageEventData) {
    switch (data.type) {
      case 'loaded':
        this.#handleLoaded(data);
        break;
      case 'resize_iframe':
        this.#iframe!.style.height = `${data.height}px`;
        this.#iframe!.style.width = `${data.width}px`;
        break;
      case 'completed':
        this.#handleCompleted(data as CompletedEvent);
        break;
      case 'error':
        this.#handleError(data.code, data.message, data.email);
        break;
      case 'content':
        this.#authorizeModal?.setAttribute('title', data.title);
        this.#authorizeModalContent?.update(data);
        this.#authorizeLogo?.classList.toggle(
          'hidden',
          data.authorizeState === AuthorizeState.Captcha,
        );
        break;
      case 'processing_status_updated':
        this.#authorizeModalContent?.update(data);
        break;
      case 'close_requested':
        this.#closeAuthorizeModal();
        break;
    }
  }
}

/**
 * Define the shop-follow-button custom element.
 */
export function defineElement() {
  defineCustomElement('shop-follow-button', ShopFollowButton);
}
