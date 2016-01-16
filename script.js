var getYelpRating = function(restaurantName) {
  var params = {
    business_name: restaurantName
  };
  chrome.storage.sync.get('location', function(item) {
    params.location = item.location;
    $.ajax({
      url: "https://damp-dusk-7674.herokuapp.com/yelp",
      data: params,
      success: function(response) {
        console.log(response.rating);
      }
    });
  });
};

getYelpRating("organique");
