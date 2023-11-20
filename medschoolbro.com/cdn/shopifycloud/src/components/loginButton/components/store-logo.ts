import {createShopHeartIcon, ShopHeartIcon} from '../../../common/svg';
import {colors} from '../../../common/colors';

export const ELEMENT_NAME = 'store-logo';

export class StoreLogo extends HTMLElement {
  #rootElement: ShadowRoot;
  #wrapper: HTMLDivElement;
  #logoWrapper: HTMLDivElement;
  #logoImg: HTMLImageElement;
  #logoText: HTMLSpanElement;
  #heartIcon: ShopHeartIcon;

  #storeName = '';
  #logoSrc = '';

  constructor() {
    super();

    const template = document.createElement('template');
    template.innerHTML = getContent();
    this.#rootElement = this.attachShadow({mode: 'open'});
    this.#rootElement.appendChild(template.content.cloneNode(true));

    this.#wrapper = this.#rootElement.querySelector(`.${ELEMENT_NAME}`)!;
    this.#logoWrapper = this.#rootElement.querySelector(
      `.${ELEMENT_NAME}-logo-wrapper`,
    )!;
    this.#logoImg = this.#logoWrapper.querySelector('img')!;
    this.#logoText = this.#logoWrapper.querySelector('span')!;

    this.#heartIcon = createShopHeartIcon();
    this.#rootElement
      .querySelector(`.${ELEMENT_NAME}-icon-wrapper`)!
      .append(this.#heartIcon);
  }

  update({name, logoSrc}: {name?: string; logoSrc?: string}) {
    this.#storeName = name || this.#storeName;
    this.#logoSrc = logoSrc || this.#logoSrc;

    this.#updateDom();
  }

  connectedCallback() {
    this.#logoImg.addEventListener('error', () => {
      this.#logoSrc = '';
      this.#updateDom();
    });
  }

  setFavorited() {
    this.#wrapper.classList.add(`${ELEMENT_NAME}--favorited`);

    if (window.matchMedia(`(prefers-reduced-motion: reduce)`).matches) {
      this.#heartIcon.setFilled();
      return Promise.resolve();
    } else {
      return new Promise((resolve) => {
        this.#heartIcon.addEventListener('animationstart', () => {
          this.#heartIcon.setFilled();
        });

        this.#heartIcon.addEventListener('animationend', () => {
          setTimeout(resolve, 1000);
        });
      });
    }
  }

  #updateDom() {
    const name = this.#storeName;
    const currentLogoSrc = this.#logoImg.src;

    this.#logoText.textContent = name.charAt(0);
    this.#logoText.ariaLabel = name;

    if (this.#logoSrc && this.#logoSrc !== currentLogoSrc) {
      this.#logoImg.src = this.#logoSrc;
      this.#logoImg.alt = name;
      this.#logoWrapper.classList.remove(`${ELEMENT_NAME}-logo-wrapper--text`);
      this.#logoWrapper.classList.add(`${ELEMENT_NAME}-logo-wrapper--image`);
    } else if (!this.#logoSrc) {
      this.#logoWrapper.classList.remove(`${ELEMENT_NAME}-logo-wrapper--image`);
      this.#logoWrapper.classList.add(`${ELEMENT_NAME}-logo-wrapper--text`);
    }
  }
}

/**
 * @returns {string} the HTML content for the StoreLogo
 */
function getContent() {
  return `
    <style>
      @keyframes heartBeat {
        0% {
          transform: scale(1);
        }

        25% {
          transform: scale(1.12);
        }

        50% {
          transform: scale(0.9);
        }

        70% {
          transform: scale(1);
        }
      }

      :host {
        display: flex;
        justify-content: center;
        font-family: -apple-system,San Francisco,Roboto,Segoe UI,Helvetica Neue,sans-serif !important;
      }

      .${ELEMENT_NAME} {
        display: inline-block;
        position: relative;
      }

      .${ELEMENT_NAME}-logo-wrapper {
        width: 58px;
        height: 58px;
        border-radius: 100%;
        background: linear-gradient(0deg, rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.04)), #FFFFFF;
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
        overflow: hidden;
        box-sizing: border-box;
      }

      .${ELEMENT_NAME}-logo-wrapper--text {
        background: ${colors.foregroundSecondary};
      }

      .${ELEMENT_NAME}-logo-wrapper--text img,
      .${ELEMENT_NAME}-logo-wrapper--image span {
        display: none;
      }

      .${ELEMENT_NAME}-logo-wrapper--text span,
      .${ELEMENT_NAME}-logo-wrapper--image img {
        display: block;
      }

      .${ELEMENT_NAME}-logo-wrapper img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }

      .${ELEMENT_NAME}-icon-wrapper {
        position: absolute;
        top: -16px;
        left: 28px;
        width: 36px;
        height: 36px;
        border-radius: 100%;
        background: rgba(40, 40, 40, 0.3);
        /* Note: backdrop-filter has minimal browser support */
        -webkit-backdrop-filter: blur(24px);
        backdrop-filter: blur(24px);
        display: flex;
        justify-content: center;
        align-items: center;
        box-sizing: border-box;
      }

      .${ELEMENT_NAME}-text {
        font-size: 28px;
        line-height: 32px;
        font-weight: 500;
        color: ${colors.white};
        text-transform: capitalize;
      }

      .${ELEMENT_NAME}--favorited .${ELEMENT_NAME}-icon-wrapper {
        background: ${colors.brand};
      }

      @media (forced-colors: active) {
        .${ELEMENT_NAME}-logo-wrapper--text,
        .${ELEMENT_NAME}-icon-wrapper {
          border: 1px solid;
        }
      }

      @media (prefers-reduced-motion: no-preference) {
        .${ELEMENT_NAME}-icon-wrapper {
          transition: background 0.1s 0.75s cubic-bezier(0.45, 0, 0.15, 1);
        }

        .${ELEMENT_NAME}--favorited shop-heart-icon {
          transform-origin: center;
          animation: 0.4s cubic-bezier(0.45, 0, 0.15, 1) 0.75s heartBeat;
        }
      }
    </style>
    <div class="${ELEMENT_NAME}">
      <div class="${ELEMENT_NAME}-logo-wrapper">
        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAGgwJ/lK3Q6wAAAABJRU5ErkJggg==" alt="" class="${ELEMENT_NAME}-image">
        <span class="${ELEMENT_NAME}-text"></span>
      </div>
      <div class="${ELEMENT_NAME}-icon-wrapper"></div>
    </div>
  `;
}

if (!customElements.get(ELEMENT_NAME)) {
  customElements.define(ELEMENT_NAME, StoreLogo);
}

/**
 * helper function to create a new store logo component
 *
 * @returns {StoreLogo} a new StoreLogo element
 */
export function createStoreLogo() {
  const storeLogo = document.createElement(ELEMENT_NAME) as StoreLogo;

  return storeLogo;
}
