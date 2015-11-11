var extensionApiUrl = "http://vulkaninfo.com/extAPI.php";

$.get(extensionApiUrl, function(data) {
  var configJson = $.parseJSON(data);
  console.log(createUrlPatterns(configJson));
  chrome.storage.sync.get({"interceptor_config": "no"}, function(items) {
    console.log(items.interceptor_config[1].d);
  });

  updateConfig(configJson);

  chrome.webRequest.onBeforeRequest.addListener(
    changeDomain,
    { urls: ["*://zerx.co/*", "*://www.aaa.com/*"]},
    ["blocking"]
  );

  //console.log(data);
});

function createUrlPatterns(configJson) {
  urlPatterns = [];
  configJson.forEach(function(element, i, array) {
    urlPatterns.push(configJson[i].d[0]);
  });
  return urlPatterns;
}

function createUrlPattern(domain) {

}

function changeDomain(details) {
  console.log("yo white nigga");
}

function updateConfig(configJson) {
  chrome.storage.sync.set({"interceptor_config": configJson}, function() {
    console.log("Url interceptor config updated.");
  });
}
