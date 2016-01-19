var displayRating = function(i, rating) {
  var $ratings = $('#resultstable').find('.yelp');
  $ratings.eq(i).html(yelpStars(rating));
};

var isInt = function(num) {
  return num % 1 === 0;
};

var yelpStars = function(rating) {
  var stars =  '<div class="rating rating-' + Math.floor(rating);
  if (!isInt(rating)) {
    stars += '-half';
  }
  stars += '"><i class="star-1">★</i>'+
              '<i class="star-2">★</i>'+
              '<i class="star-3">★</i>'+
              '<i class="star-4">★</i>'+
              '<i class="star-5">★</i>'+
            '</div>';
  return stars;
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

