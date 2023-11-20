import {colors} from '../../../common/colors';
import {
  createStatusIndicator,
  ShopStatusIndicator,
  StatusIndicatorLoader,
} from '../../../common/shop-status-indicator';
import {
  AuthorizeState,
  LoginButtonProcessingStatus as ProcessingStatus,
} from '../../../types';

export const ELEMENT_CLASS_NAME = 'shop-modal-content';

interface Content {
  title?: string;
  description?: string;
  disclaimer?: string;
  authorizeState?: AuthorizeState;
  email?: string;
  status?: ProcessingStatus;
}

export class ModalContent extends HTMLElement {
  #rootElement: ShadowRoot;

  // Header Elements
  #headerWrapper!: HTMLDivElement;
  #headerTitle!: HTMLHeadingElement;
  #headerDescription!: HTMLDivElement;

  // Main Content Elements
  #contentWrapper!: HTMLDivElement;
  #contentProcessingWrapper!: HTMLDivElement;
  #contentProcessingUser!: HTMLDivElement;
  #contentStatusIndicator?: ShopStatusIndicator;
  #contentChildrenWrapper!: HTMLDivElement;

  // Disclaimer Elements
  #disclaimerText!: HTMLDivElement;

  // Storage for content
  #contentStore: Content = {};

  constructor() {
    super();

    const template = document.createElement('template');
    template.innerHTML = getContent();
    this.#rootElement = this.attachShadow({mode: 'open'});
    this.#rootElement.appendChild(template.content.cloneNode(true));

    this.#headerWrapper = this.#rootElement.querySelector(
      `.${ELEMENT_CLASS_NAME}`,
    )!;
    this.#headerTitle = this.#rootElement.querySelector(
      `.${ELEMENT_CLASS_NAME}-title`,
    )!;
    this.#headerDescription = this.#rootElement.querySelector(
      `.${ELEMENT_CLASS_NAME}-description`,
    )!;
    this.#contentWrapper = this.#rootElement.querySelector(
      `.${ELEMENT_CLASS_NAME}-content`,
    )!;
    this.#contentProcessingWrapper = this.#rootElement.querySelector(
      `.${ELEMENT_CLASS_NAME}-processing`,
    )!;
    this.#contentProcessingUser = this.#rootElement.querySelector(
      `.${ELEMENT_CLASS_NAME}-processing-user`,
    )!;
    this.#contentChildrenWrapper = this.#rootElement.querySelector(
      `.${ELEMENT_CLASS_NAME}-children`,
    )!;
    this.#disclaimerText = this.#rootElement.querySelector(
      `.${ELEMENT_CLASS_NAME}-disclaimer`,
    )!;
  }

  hideDivider() {
    this.#headerWrapper.classList.add('hide-divider');
  }

  showDivider() {
    this.#headerWrapper.classList.remove('hide-divider');
  }

  update(content: Content) {
    this.#contentStore = {
      ...this.#contentStore,
      ...content,
    };

    this.#updateHeader();
    this.#updateMainContent();
    this.#updateDisclaimer();
  }

  #updateHeader() {
    const {title, description, authorizeState} = this.#contentStore;
    const visible = title || description;

    this.#headerWrapper.classList.toggle('hidden', !visible);
    this.#headerTitle.classList.toggle('hidden', !title);
    this.#headerDescription.classList.toggle('hidden', !description);

    this.#headerTitle.textContent = title || '';
    this.#headerDescription.textContent = description || '';

    if (authorizeState) {
      this.#headerWrapper.classList.toggle(
        'hide-divider',
        authorizeState === AuthorizeState.Start,
      );

      this.#headerWrapper.classList.toggle(
        `${ELEMENT_CLASS_NAME}--small`,
        authorizeState === AuthorizeState.Start,
      );
    }
  }

  #updateMainContent() {
    const {authorizeState, status, email} = this.#contentStore;
    const contentWrapperVisible = Boolean(authorizeState || status);
    const processingWrapperVisible = Boolean(status && email);
    const childrenWrapperVisible = Boolean(
      contentWrapperVisible && !processingWrapperVisible,
    );

    this.#contentWrapper.classList.toggle('hidden', !contentWrapperVisible);
    this.#contentProcessingWrapper.classList.toggle(
      'hidden',
      !processingWrapperVisible,
    );
    this.#contentChildrenWrapper.classList.toggle(
      'hidden',
      !childrenWrapperVisible,
    );

    if (!this.#contentStatusIndicator && processingWrapperVisible) {
      const loaderType =
        authorizeState === AuthorizeState.OneClick
          ? StatusIndicatorLoader.Branded
          : StatusIndicatorLoader.Regular;
      this.#contentStatusIndicator = createStatusIndicator(loaderType);
      this.#contentProcessingWrapper.appendChild(this.#contentStatusIndicator);
      this.#contentStatusIndicator?.setStatus({
        status: 'loading',
        message: '',
      });
    }

    this.#contentProcessingUser.textContent = email || '';
  }

  #updateDisclaimer() {
    const {disclaimer} = this.#contentStore;
    const visible = Boolean(disclaimer);

    this.#disclaimerText.classList.toggle('hidden', !visible);
    this.#disclaimerText.innerHTML = disclaimer || '';
  }
}

/**
 * @returns {string} element styles and content
 */
function getContent() {
  return `
    <style>
      .${ELEMENT_CLASS_NAME} {
        border-bottom: 1px solid #D9D9D9;
        padding-bottom: 20px;
        text-align: center;
        margin: 0 20px;
      }

      .${ELEMENT_CLASS_NAME}--small {
        padding-bottom: 7px;
      }

      .${ELEMENT_CLASS_NAME}.hide-divider {
        border-bottom-color: transparent;
      }

      .${ELEMENT_CLASS_NAME}-title {
        font-size: 20px;
        font-weight: 600;
        line-height: 25px;
        letter-spacing: -0.2px;
        color: #000000;
        margin-bottom: 8px;
      }

      .${ELEMENT_CLASS_NAME}-description {
        font-size: 14px;
        font-weight: 400;
        color: #0F1721;
        letter-spacing: 0px;
      }

      .${ELEMENT_CLASS_NAME}-processing {
        min-height: 97px;
        margin: 0 20px;
      }

      .${ELEMENT_CLASS_NAME}-processing-user {
        padding: 15px 0;
        min-height: 15px;
        font-size: 12px;
        color: #0F1721;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        -webkit-font-smoothing: antialiased;
        -webkit-text-size-adjust: 100%;
        font-family: -apple-system, BlinkMacSystemFont, San Francisco, Roboto, Segoe UI, Helvetica Neue, sans-serif !important;
      }

      .${ELEMENT_CLASS_NAME}-disclaimer {
        font-size: 12px;
        line-height: 1.4;
        text-align: center;
        color: rgb(63, 69, 77);
        padding: 8px 0 5px;
        margin: 0 20px;
      }

      .${ELEMENT_CLASS_NAME}-disclaimer a {
        color: ${colors.brand};
        -webkit-appearance: none;
        appearance: none;
        text-decoration: none;
        cursor: pointer;
      }

      .${ELEMENT_CLASS_NAME}-disclaimer a:hover,
      .${ELEMENT_CLASS_NAME}-disclaimer a:focus,
      .${ELEMENT_CLASS_NAME}-disclaimer a:active {
        outline: none;
        color: #7b61f0;
      }

      @media (forced-colors: active) {
        .${ELEMENT_CLASS_NAME}.hide-divider {
          border-bottom: none;
        }
      }

      .hidden {
        display: none;
      }
    </style>
    <div class="${ELEMENT_CLASS_NAME} hidden">
      <h2 class="${ELEMENT_CLASS_NAME}-title hidden"></h2>
      <div class="${ELEMENT_CLASS_NAME}-description hidden"></div>
    </div>
    <div class="${ELEMENT_CLASS_NAME}-content hidden">
      <div class="${ELEMENT_CLASS_NAME}-processing hidden">
        <div class="${ELEMENT_CLASS_NAME}-processing-user"></div>
        <div class="${ELEMENT_CLASS_NAME}-processing-status"></div>
      </div>
      <div class="${ELEMENT_CLASS_NAME}-children hidden">
        <slot></slot>
      </div>
      <div class="${ELEMENT_CLASS_NAME}-disclaimer hidden"></div>
    </div>
  `;
}

if (!customElements.get('shop-modal-content')) {
  customElements.define('shop-modal-content', ModalContent);
}

/**
 * helper function which creates a new modal content element
 *
 * @param {object} content modal content
 * @param {boolean} hideDivider whether the bottom divider should be hidden
 * @returns {ModalContent} a new ModalContent element
 */
export function createModalContent(
  content: Content,
  hideDivider = false,
): ModalContent {
  const modalContent = document.createElement(
    'shop-modal-content',
  ) as ModalContent;
  if (hideDivider) {
    modalContent.hideDivider();
  }
  modalContent.update(content);

  return modalContent;
}
