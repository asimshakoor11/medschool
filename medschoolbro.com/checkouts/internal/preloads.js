
    (function() {
      var baseURL = "https://cdn.shopify.com/shopifycloud/checkout-web/assets/";
      var scripts = ["https://cdn.shopify.com/shopifycloud/checkout-web/assets/runtime.latest.en.2acd1ca4f13a0ed2f25a.js","https://cdn.shopify.com/shopifycloud/checkout-web/assets/199.latest.en.17804cd5078a63a43afb.js","https://cdn.shopify.com/shopifycloud/checkout-web/assets/441.latest.en.04eff29e3df2d466c911.js","https://cdn.shopify.com/shopifycloud/checkout-web/assets/598.latest.en.b79d6b94ade3c05501db.js","https://cdn.shopify.com/shopifycloud/checkout-web/assets/app.latest.en.db357a83396e6f9d08b9.js","https://cdn.shopify.com/shopifycloud/checkout-web/assets/731.latest.en.13d4de92b88330e8fea9.js","https://cdn.shopify.com/shopifycloud/checkout-web/assets/669.latest.en.b76834e73689753fbe44.js","https://cdn.shopify.com/shopifycloud/checkout-web/assets/844.latest.en.7fcd45ae446a9a5574e8.js","https://cdn.shopify.com/shopifycloud/checkout-web/assets/Redesign.latest.en.833e40b88e2b8c56df16.js"];
      var styles = ["https://cdn.shopify.com/shopifycloud/checkout-web/assets/199.latest.en.4685743ee2b9594f0e56.css","https://cdn.shopify.com/shopifycloud/checkout-web/assets/app.latest.en.e73cab4b1bb1fcdbd393.css","https://cdn.shopify.com/shopifycloud/checkout-web/assets/669.latest.en.5f60c0e91d9d5d6ad7d1.css","https://cdn.shopify.com/shopifycloud/checkout-web/assets/661.latest.en.0cbd326b7e71017ec76e.css"];
      var fontPreconnectUrls = [];
      var fontPrefetchUrls = [];
      var imgPrefetchUrls = ["https://cdn.shopify.com/s/files/1/0738/6031/7472/files/MSB_Logo_w_TM_x320.png?v=1684889599"];

      function preconnect(url, callback) {
        var link = document.createElement('link');
        link.rel = 'dns-prefetch preconnect';
        link.href = url;
        link.crossOrigin = '';
        link.onload = link.onerror = callback;
        document.head.appendChild(link);
      }

      function preconnectAssets() {
        var resources = [baseURL].concat(fontPreconnectUrls);
        var index = 0;
        (function next() {
          var res = resources[index++];
          if (res) preconnect(res[0], next);
        })();
      }

      function prefetch(url, as, callback) {
        var link = document.createElement('link');
        if (link.relList.supports('prefetch')) {
          link.rel = 'prefetch';
          link.fetchPriority = 'low';
          link.as = as;
          if (as === 'font') link.type = 'font/woff2';
          link.href = url;
          link.crossOrigin = '';
          link.onload = link.onerror = callback;
          document.head.appendChild(link);
        } else {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', url, true);
          xhr.onloadend = callback;
          xhr.send();
        }
      }

      function prefetchAssets() {
        var resources = [].concat(
          scripts.map(function(url) { return [url, 'script']; }),
          styles.map(function(url) { return [url, 'style']; }),
          fontPrefetchUrls.map(function(url) { return [url, 'font']; }),
          imgPrefetchUrls.map(function(url) { return [url, 'image']; })
        );
        var index = 0;
        (function next() {
          var res = resources[index++];
          if (res) prefetch(res[0], res[1], next);
        })();
      }

      function onLoaded() {
        preconnectAssets();
        prefetchAssets();
      }

      if (document.readyState === 'complete') {
        onLoaded();
      } else {
        addEventListener('load', onLoaded);
      }
    })();
  