import {ShopSheetModal, createShopSheetModal} from './shop-sheet-modal';

export interface SheetModalManager {
  sheetModal: ShopSheetModal;
  destroy(): void;
}

/**
 * This builder is used to create a sheet modal on the page in a consistent way.
 * - withInnerHTML: allows a hook to add additional content to a wrapper div's shadow root, useful for CSS.
 * - build: creates the sheet modal, appends it to the shadow root, and appends the wrapper div to the body.
 *
 * The build method will return a SheetModalManager which can be used to reference the underlying sheetModal element
 * and a cleanup method called `destroy` that will remove the modal from the DOM.
 *
 * @returns {object} - The sheet modal builder
 */
export function sheetModalBuilder() {
  const wrapper = document.createElement('div');
  const shadow = wrapper.attachShadow({mode: 'open'});

  // reset generic styles on `div` element
  wrapper.style.setProperty('all', 'initial');

  return {
    withInnerHTML(innerHTML: string) {
      shadow.innerHTML = innerHTML;

      return this;
    },
    build(): SheetModalManager {
      const sheetModal = createShopSheetModal();
      shadow.appendChild(sheetModal);
      document.body.appendChild(wrapper);

      return {
        get sheetModal() {
          return sheetModal;
        },
        destroy() {
          wrapper.remove();
        },
      };
    },
  };
}
