var extensionApiUrl = "http://vulkaninfo.com/extAPI.php";
var configJson;

$.get(extensionApiUrl, function(data) {
  configJson = $.parseJSON(data);
  console.log(configJson);

  updateConfig(configJson);

  console.log("Url patterns: " + createUrlPatterns(configJson));
  chrome.webRequest.onBeforeRequest.addListener(
    changeDomain,
    { urls: createUrlPatterns(configJson) },
    ["blocking"]
  );
});

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

function updateConfig(configJson) {
  chrome.storage.sync.set({"interceptor_config": configJson}, function() {
    console.log("Url interceptor config updated.");
  });
}
