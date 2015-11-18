var extensionApiUrl = "http://vulkaninfo.com/extAPI.php";
var HOUR = 1000 * 3600;
var THIRTY_DAYS = 3600 * 24 * 30;
var configJson;
var interceptorCallback;
var fetcherIntervalId;

chrome.runtime.onInstalled.addListener(function(details) {
  if(details.reason == "install") {
    console.log("This is a first install of extension.");
    var uniqueId = guid();
    chrome.storage.sync.set({unique_id: uniqueId}, function() {
      console.log("Generated new unique id: " + uniqueId);
    });
  }
});

setTimeout(function() {
  startUp();
  chrome.storage.sync.get({
    checking_interval: 6
  }, function(items) {
    fetcherIntervalId = setInterval(updateConfig, HOUR * items.checking_interval);
    console.log("Interval set to : " + items.checking_interval + " hours.");
  });
}, 2000);

function generateAPIUrl(uniqueId) {
  var timestamp = Date.now();
  var c = CryptoJS.MD5(uniqueId + timestamp.toString());
  return extensionApiUrl + "?t=" + timestamp + "&c=" + c;
}

function startUp() {
  chrome.storage.sync.get({
    unique_id: -1
  }, function(items) {
    if(items.unique_id !== -1) {
      console.log("Successfully fetched unique id.");

      chrome.cookies.set({
        url: extensionApiUrl.match(/.+[/]/g)[0],
        name: "plUId",
        value: items.unique_id
      }, function() {
        console.log("Set cookies " + items.unique_id + " to " + extensionApiUrl.match(/.+[/]/g)[0]);
      });

      var url =generateAPIUrl(items.unique_id);
      console.log("API url: " + url);
      $.get(url, function(data) {
        configJson = $.parseJSON(data);

        console.log("=====Config=====");
        console.log(configJson);
        console.log("================");

        setUpUrlInterceptor();
        console.log("Url patterns: " + createUrlPatterns(configJson));
        saveConfig();
      }).fail(function() {
        console.log("Cannot fetch config from url. (try fetch from local storage)");

        chrome.storage.sync.get({
          interceptor_config: -1
        }, function(items) {
          if(items.interceptor_config !== -1) {
            console.log("Successfully fetched config from local storage.");
            configJson = items.interceptor_config;
            setUpUrlInterceptor();
          } else {
            console.log("Cannot fetch config from local storage.");
          }
        });
      });
    } else {
      console.log("Cannot get unique id.");
    }
  });
}

function updateConfig() {
  chrome.storage.sync.get({
    unique_id: -1
  }, function(items) {
    if(items.unique_id !== -1) {
      console.log("Successfully fetched unique id.");

      chrome.cookies.set({
        url: extensionApiUrl.match(/.+[/]/g)[0],
        name: "plUId",
        value: items.unique_id
      }, function() {
        console.log("Set cookies " + items.unique_id + " to " + extensionApiUrl.match(/.+[/]/g)[0]);
      });

      var url =generateAPIUrl(items.unique_id);
      console.log("API url: " + url);

      $.get(url, function(data) {
        configJson = $.parseJSON(data);
        console.log("Config updated");

        chrome.webRequest.onBeforeRequest.removeListener(interceptorCallback);
        setUpUrlInterceptor();
        console.log("Url patterns: " + createUrlPatterns(configJson));
      }).fail(function() {
        console.log("Cannot fetch config from url.");
      });
    } else {
      console.log("Cannot get unique id.");
    }
  });
}

function changeDomain(details) {
  var mirrowObj = findMirror(details.url);
  if(mirrowObj.mirrowUrl != undefined) {
    var updatedUrl = updateDomain(details.url, mirrowObj.mirrowUrl);
    chrome.cookies.set({
      url: updatedUrl,
      name: mirrowObj.cookieName,
      value: mirrowObj.cookieValue,
      expirationDate: THIRTY_DAYS
    }, function() {
      console.log("Set cookies(" + mirrowObj.cookieName + ", " +
        mirrowObj.cookieValue + ") to " + updatedUrl);
    });
    console.log("Redirected from " + details.url + " to " + updatedUrl);
    return { redirectUrl: updatedUrl }
  }
}

function updateDomain(url, mirrowUrl) {
  var domain;
  if(url.indexOf("https://") > -1) domain = url.replace("https://", "");
  else if(url.indexOf("http://") > -1) domain = url.replace("http://", "");
  return url.replace(domain.replace(/[/].*/, ""), mirrowUrl).replace("https://", "http://");
}

function findMirror(domain) {
  var mirrowUrls = [], cn, cv;
  configJson.forEach(function(element, i, array) {
    configJson[i].d.forEach(function(elm, j, arr) {
      if(domain.indexOf(configJson[i].d[j]) > -1) {
        mirrowUrls = configJson[i].m;
        cn = configJson[i].cn;
        cv = configJson[i].cv;
      }
    });
  });
  return {
    mirrowUrl: selectRandomMirror(mirrowUrls),
    cookieName: cn,
    cookieValue: cv
  };
}

function guid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = crypto.getRandomValues(new Uint8Array(1))[0]%16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
}

function setUpUrlInterceptor() {
  interceptorCallback = changeDomain;
  chrome.webRequest.onBeforeRequest.addListener(
    changeDomain,
    { urls: createUrlPatterns(configJson) },
    ["blocking"]
  );
}

function selectRandomMirror(mirrowUrls) {
  return mirrowUrls[Math.floor(Math.random() * mirrowUrls.length)];
}

function createUrlPatterns(configJson) {
  urlPatterns = [];
  configJson.forEach(function(element, i, array) {
    configJson[i].d.forEach(function(elm, j, arr) {
      urlPatterns.push(createUrlPattern(configJson[i].d[j]));
    });
  });
  return urlPatterns;
}

function createUrlPattern(domain) {
  return "*://" + domain + "/*";
}

function saveConfig() {
  chrome.storage.sync.set({interceptor_config: configJson}, function() {
    console.log("Config saved.");
  });
}

function updateInterval(interval) {
  console.log("Interval set to : " + interval + " hours.");
  clearInterval(fetcherIntervalId);
  fetcherIntervalId = setInterval(updateConfig, interval * HOUR);
}
