import {startBugsnag, isBrowserSupported} from '../../common/init';
import {defineElement as defineShopSwirl} from '../../common/shop-swirl';

import {defineElement as defineShopFollowButton} from './shop-follow-button';
import {defineElement as defineShopLoginButton} from './shop-login-button';
import {defineElement as defineShopLoginDefault} from './shop-login-default';

/**
 * Initialize the login button web components.
 * This is the entry point that will be used for code-splitting.
 */
function init() {
  if (!isBrowserSupported()) return;
  // eslint-disable-next-line no-process-env
  startBugsnag({bundle: 'loginButton', bundleLocale: process.env.BUILD_LOCALE});

  // The order of these calls is not significant. However, it is worth noting that
  // ShopFollowButton and ShopLoginDefault all rely on the ShopLoginButton.
  // To ensure that the ShopLoginButton is available when the other components are
  // defined, we prioritize defining the ShopLoginButton first.
  defineShopLoginButton();
  defineShopFollowButton();
  defineShopLoginDefault();
  defineShopSwirl();
}

init();
