var extensionApiUrl = "http://vulkaninfo.com/extAPI.php";
var HOUR = 1000 * 3600;
var configJson;
var interceptorCallback;
var fetcherIntervalId;

startUp();
chrome.storage.sync.get({
  checking_interval: 6
}, function(items) {
  fetcherIntervalId = setInterval(updateConfig, HOUR * items.checking_interval);
  console.log("Interval set to : " + items.checking_interval + " hours.");
});

function startUp() {
  $.get(extensionApiUrl, function(data) {
    configJson = $.parseJSON(data);

    console.log("=====Config=====");
    console.log(configJson);
    console.log("================");

    interceptorCallback = changeDomain;
    chrome.webRequest.onBeforeRequest.addListener(
      changeDomain,
      { urls: createUrlPatterns(configJson) },
      ["blocking"]
    );
    console.log("Url patterns: " + createUrlPatterns(configJson));
    saveConfig(configJson);
  }).fail(function() {
    console.log("Cannot fetch config from url. (fetched from local storage)");

    chrome.storage.sync.get({
      interceptor_config: undefined
    }, function(items) {
      if(items.interceptor_config != undefined) {
        configJson = items.interceptor_config;

        interceptorCallback = changeDomain;
        chrome.webRequest.onBeforeRequest.addListener(
          changeDomain,
          { urls: createUrlPatterns(configJson) },
          ["blocking"]
        );
      } else {
        console.log("Cannot fetch config file from local storage.");
      }
    });
  });
}

function updateConfig() {
  $.get(extensionApiUrl, function(data) {
    configJson = $.parseJSON(data);
    console.log("Config updated");

    chrome.webRequest.onBeforeRequest.removeListener(interceptorCallback);
    interceptorCallback = changeDomain;
    chrome.webRequest.onBeforeRequest.addListener(
      changeDomain,
      { urls: createUrlPatterns(configJson) },
      ["blocking"]
    );
    console.log("Url patterns: " + createUrlPatterns(configJson));
  }).fail(function() {
    console.log("Cannot fetch config from url.");
  });
}

function changeDomain(details) {
  var mirrowObj = findMirror(details.url);
  if(mirrowObj.mirrowUrl != undefined) {
    var updatedUrl = updateDomain(details.url, mirrowObj.mirrowUrl);
    chrome.cookies.set({
      url: updatedUrl,
      name: mirrowObj.cookieName,
      value: mirrowObj.cookieValue
    });
    console.log("Redirected from " + details.url + " to " + updatedUrl);
    console.log("Set cookies(" + mirrowObj.cookieName + ", " +
      mirrowObj.cookieValue + ") to " + updatedUrl);
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

function saveConfig(configJson) {
  chrome.storage.sync.set({interceptor_config: configJson}, function() {
    console.log("Url interceptor config saved.");
  });
}

function updateInterval(interval) {
  console.log("Interval set to : " + interval + " hours.");
  clearInterval(fetcherIntervalId);
  fetcherIntervalId = setInterval(updateConfig, interval * HOUR);
}
