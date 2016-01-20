var displayRating = function(i, restaurant) {
  var $ratings = $('#resultstable').find('.yelp');
  if ('rating' in restaurant) {
    $ratings.eq(i).html(yelpStars(restaurant));
  }
};

var isInt = function(num) {
  return num % 1 === 0;
};

var yelpStars = function(restaurant) {
  var stars = '<a class="yelp-link" href="' + restaurant.url + '">' +
                '<div class="rating rating-' + Math.floor(restaurant.rating);
  if (!isInt(restaurant.rating)) {
    stars += '-half';
  }
  stars += '"><i class="star-1">★</i>'+
              '<i class="star-2">★</i>'+
              '<i class="star-3">★</i>'+
              '<i class="star-4">★</i>'+
              '<i class="star-5">★</i>'+
            '</div></a>';
  return stars;
};

var getYelpRating = function(i, restaurantName) {
  if (localStorage && localStorage.getItem(restaurantName)) {
    var restaurant = JSON.parse(localStorage.getItem(restaurantName));

    // If it's within a week, use existing rating
    if ((Date.now() - restaurant.timestamp) / (1000*60*60*24*7) < 1) {
      displayRating(i, restaurant);
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
            url: response.url,
            timestamp: Date.now()}));

        displayRating(i, response);
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

