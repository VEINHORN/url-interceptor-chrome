$(document).ready(function() {
  loadOptions();
  $('#save-btn').click(saveOptions);
});

function loadOptions() {
  chrome.storage.sync.get({
    checking_interval: 6
  }, function(items) {
    $('#checking-interval').val(items.checking_interval);
  });
}

function saveOptions() {
  $('#status').css("display", "block");
  var hours = $('#checking-interval').val();
  if(hours >= 3) {
    chrome.storage.sync.set({
      checking_interval: $('#checking-interval').val()
    }, function() {
      $('#status').html('Настройки сохранены.');
      $("#status").delay(1000).fadeOut('slow');

      var background = chrome.extension.getBackgroundPage();
      background.updateInterval(hours);
    });
  } else {
    $('#status').html('Интервал должен быть больше 3 часов.');
    $("#status").delay(1000).fadeOut('slow');
  }
}
