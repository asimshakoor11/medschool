import {I18n} from '../../../common/translator/i18n';
import {
  ShopLogo,
  createShopHeartIcon,
  ShopHeartIcon,
} from '../../../common/svg';
import Bugsnag from '../../../common/bugsnag';
import {calculateContrast, inferBackgroundColor} from '../../../common/colors';

const ATTRIBUTE_FOLLOWING = 'following';

export class FollowOnShopButton extends HTMLElement {
  private _rootElement: ShadowRoot | null = null;
  private _button: HTMLButtonElement | null = null;
  private _wrapper: HTMLSpanElement | null = null;
  private _heartIcon: ShopHeartIcon | null = null;
  private _followSpan: HTMLSpanElement | null = null;
  private _followingSpan: HTMLSpanElement | null = null;
  private _i18n: I18n | null = null;
  private _followTextWidth = 0;
  private _followingTextWidth = 0;

  constructor() {
    super();

    if (!customElements.get('shop-logo')) {
      customElements.define('shop-logo', ShopLogo);
    }
  }

  async connectedCallback(): Promise<void> {
    await this._initTranslations();
    this._initElements();
  }

  setFollowing({
    following = true,
    skipAnimation = false,
  }: {
    following?: boolean;
    skipAnimation?: boolean;
  }) {
    this._button?.classList.toggle(`button--animating`, !skipAnimation);
    this._button?.classList.toggle(`button--following`, following);

    if (this._followSpan !== null && this._followingSpan !== null) {
      this._followSpan.ariaHidden = following ? 'true' : 'false';
      this._followingSpan.ariaHidden = following ? 'false' : 'true';
    }

    this.style.setProperty(
      '--button-width',
      `${following ? this._followingTextWidth : this._followTextWidth}px`,
    );

    if (
      window.matchMedia(`(prefers-reduced-motion: reduce)`).matches ||
      skipAnimation
    ) {
      this._heartIcon?.setFilled(following);
    } else {
      this._button
        ?.querySelector('.follow-text')
        ?.addEventListener('transitionend', () => {
          this._heartIcon?.setFilled(following);
        });
    }
  }

  setFocused() {
    this._button?.focus();
  }

  private async _initTranslations() {
    try {
      // BUILD_LOCALE is used for generating localized bundles.
      // See ./scripts/i18n-dynamic-import-replacer-rollup.mjs for more info.
      // eslint-disable-next-line no-process-env
      const locale = process.env.BUILD_LOCALE || I18n.getDefaultLanguage();
      const dictionary = await import(`../translations/${locale}.json`);
      this._i18n = new I18n({[locale]: dictionary});
    } catch (error) {
      if (error instanceof Error) {
        Bugsnag.notify(error);
      }
    }
    return null;
  }

  private _initElements() {
    const template = document.createElement('template');
    template.innerHTML = getTemplateContents();

    this._rootElement = this.attachShadow({mode: 'open'});
    this._rootElement.appendChild(template.content.cloneNode(true));

    if (this._i18n) {
      const followText = this._i18n.translate('follow_on_shop.follow', {
        shop: getShopLogoHtml('white'),
      });
      const followingText = this._i18n.translate('follow_on_shop.following', {
        shop: getShopLogoHtml('black'),
      });
      this._rootElement.querySelector('slot[name="follow-text"]')!.innerHTML =
        followText;
      this._rootElement.querySelector(
        'slot[name="following-text"]',
      )!.innerHTML = followingText;
    }

    this._button = this._rootElement.querySelector(`.button`)!;
    this._wrapper = this._button.querySelector(`.follow-icon-wrapper`)!;
    this._followSpan = this._rootElement?.querySelector('span.follow-text');
    this._followingSpan = this._rootElement?.querySelector(
      'span.following-text',
    );

    this._heartIcon = createShopHeartIcon();
    this._wrapper.prepend(this._heartIcon);

    this._followTextWidth =
      this._rootElement.querySelector('.follow-text')?.scrollWidth || 0;
    this._followingTextWidth =
      this._rootElement.querySelector('.following-text')?.scrollWidth || 0;
    this.style.setProperty(
      '--reserved-width',
      `${Math.max(this._followTextWidth, this._followingTextWidth)}px`,
    );

    this.setFollowing({
      following: this.hasAttribute(ATTRIBUTE_FOLLOWING),
      skipAnimation: true,
    });

    this._setButtonStyle();
  }

  /**
   * Adds extra classes to the parent button component depending on the following calculations
   * 1. If the currently detected background color has a higher contrast ratio with white than black, the "button--dark" class will be added
   * 2. If the currently detected background color has a contrast ratio <= 3.06 ,the "button--bordered" class will be added
   *
   * When the "button--dark" class is added, the "following" text and shop logo should be changed to white.
   * When the "button--bordered" class is added, the button should have a border.
   */
  private _setButtonStyle() {
    const background = inferBackgroundColor(this);
    const isDark =
      calculateContrast(background, '#ffffff') >
      calculateContrast(background, '#000000');
    const isBordered = calculateContrast(background, '#5433EB') <= 3.06;

    this._button?.classList.toggle('button--dark', isDark);
    this._button?.classList.toggle('button--bordered', isBordered);

    if (isDark && this._i18n) {
      const followingText = this._i18n.translate('follow_on_shop.following', {
        shop: getShopLogoHtml('white'),
      });
      this._rootElement!.querySelector(
        'slot[name="following-text"]',
      )!.innerHTML = followingText;
    }
  }
}

if (!customElements.get('follow-on-shop-button')) {
  customElements.define('follow-on-shop-button', FollowOnShopButton);
}

/**
 * Get the template contents for the follow on shop trigger button.
 *
 * @returns {string} string The template for the follow on shop trigger button
 */
function getTemplateContents() {
  return `
    <style>
      @keyframes followBackground {
        0% {
          width: 100%;
          height: 100%;
          transform: scaleY(1);
        }

        25% {
          transform: scaleY(1);
        }

        50% {
          transform: scaleY(1.2);
        }

        100% {
          transform: scaleY(1);
          width: 37px;
          height: 37px;
        }
      }

      :host {
        display: inline-block;
        line-height: normal;

        --following-text-color: #000000;
        --border-color: #5433EB;
        --border-hover-color: #7f68e9;
        --parent-width: var(--reserved-width, 177px);

        /* Reserve width to prevent layout shifts */
        width: var(--parent-width);
      }

      .button {
        border: none;
        margin: 0;
        padding: 0;
        overflow: visible;
        isolation: isolate;

        background: transparent;
        color: #ffffff;
        font: 16px/19px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica;

        line-height: normal;

        -webkit-font-smoothing: inherit;
        -moz-osx-font-smoothing: inherit;

        -webkit-appearance: none;
        position: relative;
        display: inline-block;
        align-items: center;

        height: 37px;
        width: var(--button-width, 100%);
        border-radius: 48px;
      }

      .button:focus,
      .button:focus-visible {
        outline: none;
      }

      .button--dark {
        --following-text-color: #ffffff;
      }

      .button--bordered {
        --border-color: #EDEDED;
        --border-hover-color: #EDEDED;
      }

      .follow-icon-wrapper {
        display: flex;
        align-items: center;
        width: auto;
        position: relative;
        z-index: 1;
        top: 0;
        left: 0;
      }

      .follow-icon-wrapper:before {
        content: '';
        background: #5433EB;
        border-radius: 48px;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        position: absolute;
        z-index: -1;
        transform-origin: center;
        box-sizing: border-box;
        border: 1px solid var(--border-color);
      }

      .button:not(.button--following):focus-visible .follow-icon-wrapper:before,
      .button:not(.button--following):hover .follow-icon-wrapper:before {
        background: #7f68e9;
        border-color: var(--border-hover-color);
      }

      .follow-icon-wrapper shop-heart-icon {
        position: absolute;
        top: 11px;
        left: 12px;
      }

      .follow-text,
      .following-text {
        white-space: nowrap;
        padding: 9px 11px 9px 35px;
        cursor: pointer;
      }

      .follow-text shop-logo,
      .following-text shop-logo {
        position: relative;
        top: 3px;
        padding-left: 1px;
      }

      .following-text {
        opacity: 0;
        pointer-events: none;
        color: var(--following-text-color);
        padding: 9px 8px 9px 43px;
        position: absolute;
        top: 0;
        left: 0;
        box-sizing: border-box;
        overflow: hidden;
        max-width: var(--button-width);
      }

      .following-icon {
        opacity: 0;
      }

      .button--following .follow-icon-wrapper:before {
        position: absolute;
        width: 37px;
        height: 37px;
        padding: 0;
      }

      .button--following:focus-visible,
      .button--following:hover {
        background: rgb(217 217 217 / 0.2);
      }

      .button--following .follow-text,
      .button--following .follow-icon {
        opacity: 0;
      }

      .button--following .following-text {
        opacity: 1;
        width: auto;
        pointer-events: auto;
      }

      .button--following .following-icon {
        opacity: 1;
      }

      .button--following .follow-icon-wrapper shop-heart-icon {
        transform: translateX(-1.5px);
      }

      @media (prefers-reduced-motion: no-preference) {
        .button--animating {
          transition: 400ms width cubic-bezier(0.45, 0, 0.15, 1);
        }

        .button--animating .follow-text {
          transition: 200ms opacity cubic-bezier(0.45, 0, 1, 1);
        }

        .button--animating .following-text {
          transition: 200ms opacity cubic-bezier(0, 0, 0.15, 1);
          transition-delay: 0.2s;
        }

        .button--animating.button--following .follow-icon-wrapper:before {
          animation: followBackground 0.4s cubic-bezier(0.45, 0, 0.15, 1);
        }

        .button--animating.button--following .follow-icon-wrapper shop-heart-icon {
          transition: 400ms transform cubic-bezier(0.45, 0, 0.15, 1);
        }
      }
    </style>
    <button class="button">
      <span class="follow-icon-wrapper">
        <span class="follow-text">
          <slot name="follow-text">
            Follow on ${getShopLogoHtml('white')}
          </slot>
        </span>
      </span>

      <span class="following-text" aria-hidden="true">
        <slot name="following-text">
          Following on ${getShopLogoHtml('black')}
        </slot>
      </span>
    </button>
  `;
}

/**
 * helper function to create a follow on shop trigger button
 *
 * @param {string} color The color of the Shop logo.
 * @returns {string} The HTML for the Shop logo in the Follow on Shop button.
 */
export function getShopLogoHtml(color: string): string {
  return `<shop-logo role="img" color=${color} size="15" style="display: inline-flex;" aria-label="Shop"></shop-logo>`;
}

/**
 * helper function for building a Follow on Shop Button
 *
 * @param {boolean} following Whether the user is following the shop.
 * @returns {FollowOnShopButton} - a Follow on Shop Button
 */
export function createFollowButton(following: boolean): FollowOnShopButton {
  const element = document.createElement('follow-on-shop-button');

  if (following) {
    element.setAttribute(ATTRIBUTE_FOLLOWING, '');
  }

  return element as FollowOnShopButton;
}
