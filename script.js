var displayRating = function(i, rating) {
  var $ratings = $('#resultstable').find('.yelp');
  $ratings.eq(i).text(rating);
};

var getYelpRating = function(i, restaurantName) {
  if (localStorage && localStorage.getItem(restaurantName)) {
    var restaurant = JSON.parse(localStorage.getItem(restaurantName));

    // If it's within a week, use existing rating
    if ((Date.now() - restaurant.timestamp) / (1000*60*60*24*7) < 1) {
      displayRating(i, restaurant.rating);
      return;
    }
  }
  var params = {
    business_name: restaurantName
  };
  chrome.storage.sync.get('location', function(item) {
    params.location = item.location;
    $.ajax({
      url: "https://damp-dusk-7674.herokuapp.com/yelp",
      data: params,
      success: function(response) {
        localStorage.setItem(
          restaurantName,
          JSON.stringify({
            rating: response.rating,
            timestamp: Date.now()}));

        displayRating(i, response.rating);
      },
      error: function() {
        console.log("Error getting rating");
      }
    });
  });
};

var addYelpColumn = function() {
  $('#resultstable tr:gt(0)').append('<td class="yelp"></td>');
  $('#resultstable tr:first').append("<th>Yelp Rating</th>");
};

addYelpColumn();
$restaurants = $('td.restaurant h4 a');
$restaurants.each(function(i, name) {
  getYelpRating(i, $(name).text());
});

