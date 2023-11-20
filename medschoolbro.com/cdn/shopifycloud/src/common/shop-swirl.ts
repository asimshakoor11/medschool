import {pickLogoColor} from './colors';
import {defineCustomElement} from './init';

export class ShopSwirl extends HTMLElement {
  constructor() {
    super();

    const template = document.createElement('template');
    const size = this.getAttribute('size');
    // If not specified, will assume a white background and render the purple logo.
    const backgroundColor = this.getAttribute('background-color') || '#FFF';

    template.innerHTML = getTemplateContents(
      size ? Number.parseInt(size, 10) : undefined,
      backgroundColor,
    );

    this.attachShadow({mode: 'open'}).appendChild(
      template.content.cloneNode(true),
    );
  }
}

/**
 * @param {number} size size of the logo.
 * @param {string} backgroundColor hex or rgb string for background color.
 * @returns {string} HTML content for the logo.
 */
function getTemplateContents(size = 36, backgroundColor: string) {
  const [red, green, blue] = pickLogoColor(backgroundColor);
  const color = `rgb(${red}, ${green}, ${blue})`;
  const sizeRatio = 23 / 20;
  const height = size;
  const width = Math.round(height / sizeRatio);

  return `
    <style>
      .shop-swirl {
        height: ${height}px;
        width: ${width}px;
        vertical-align: middle;
      }
    </style>
    <svg class="shop-swirl" viewBox="0 0 22 25" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.43 0C4.607 0 2.2 1.63.266 2.952L.21 2.99a.476.476 0 0 0-.146.632l1.91 3.291a.486.486 0 0 0 .327.235.5.5 0 0 0 .398-.104l.15-.127c.995-.832 2.586-1.957 6.441-2.25 2.146-.174 4.005.404 5.372 1.666 1.503 1.386 2.4 3.626 2.4 5.991 0 4.348-2.56 7.084-6.68 7.14-3.391-.02-5.67-1.788-5.67-4.404 0-1.399.651-2.306 1.884-3.216a.437.437 0 0 0 .124-.554L4.995 8.03a.493.493 0 0 0-.685-.193C2.386 8.98.03 11.067.155 15.077c.156 5.111 4.403 9.009 9.921 9.168h.63C17.268 24.034 22 19.166 22 12.576 22.01 6.474 17.6 0 9.43 0z" fill="${color}" />
    </svg>
  `;
}

/**
 * Define the shop-swirl custom element.
 */
export function defineElement() {
  defineCustomElement('shop-swirl', ShopSwirl);
}
