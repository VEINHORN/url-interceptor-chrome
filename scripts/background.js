var extensionApiUrl = "http://vulkaninfo.com/extAPI.php";
var configJson;
var interceptorCallback;
var intervalId;

startUp();
intervalId = setInterval(updateConfig, 5000);

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
    //setUpInterceptor();
    //saveConfig(configJson); // saves config in local storage, u should save config
  }).fail(function() {
    // fetch here data from local storage and set up interceptor
    console.log("Cannot fetch config from url.");
  });
}

function updateConfig() {
  $.get(extensionApiUrl, function(data) {
    configJson = $.parseJSON(data);
    console.log("Config updated");

    configJson[0].d.push("aaa.com")
    configJson[0].m.push("vk.com")

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

function setUpInterceptor() {

}

function changeDomain(details) {
  var mirrowUrl = findMirrorUrl(details.url);
  if(mirrowUrl != undefined) {
    var updatedUrl = updateDomain(details.url, mirrowUrl);
    console.log("Redirected from " + details.url + " to " + updatedUrl);
    return { redirectUrl: updatedUrl/*"https://vk.com"*/ }
  }
}

function updateDomain(url, mirrowUrl) {
  var domain;
  if(url.indexOf("https://") > -1) domain = url.replace("https://", "");
  else if(url.indexOf("http://") > -1) domain = url.replace("http://", "");
  return url.replace(domain.replace(/[/].*/, ""), mirrowUrl).replace("https://", "http://");
}

function findMirrorUrl(domain) {
  var mirrowUrls = [];
  configJson.forEach(function(element, i, array) {
    configJson[i].d.forEach(function(elm, j, arr) {
      if(domain.indexOf(configJson[i].d[j]) > -1) {
        mirrowUrls = configJson[i].m;
      }
    });
  });
  return selectRandomMirror(mirrowUrls);
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
  chrome.storage.sync.set({"interceptor_config": configJson}, function() {
    console.log("Url interceptor config updated.");
  });
}
