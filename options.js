// Saves options to chrome.storage.sync.
function save_location() {
  var location = $('#city').val();
  chrome.storage.sync.set({
    'location': location,
  }, function() {
    // Update status
    var status = $('#status');
    status.text('Location saved.');
    setTimeout(function() {
      status.empty();
    }, 1000);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_location() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get('location', function(items) {
    $('#city').val(items.location);
  });
}

$(restore_location);
$('#save').on('click', save_location);
