# -*- coding: utf-8 -*-
import os
import argparse
import json
import pprint
import sys
import urllib
import oauth2

from flask import Flask, request as req, jsonify

app = Flask(__name__)

API_HOST = 'api.yelp.com'
DEFAULT_LOCATION = 'Manhattan'
SEARCH_LIMIT = 3
SEARCH_PATH = '/v2/search/'
BUSINESS_PATH = '/v2/business/'

yelp_client = None

class Yelp():

    def __init__(self, consumer_key, consumer_secret, token, token_secret):
        self.consumer_key = consumer_key
        self.consumer_secret = consumer_secret
        self.token = token
        self.token_secret = token_secret

    def _request(self, host, path, url_params=None):
        """Prepares OAuth authentication and sends the request to the API.

        Args:
            host (str): The domain host of the API.
            path (str): The path of the API after the domain.
            url_params (dict): An optional set of query parameters in the request.

        Returns:
            dict: The JSON response from the request.

        Raises:
            urllib.HTTPError: An error occurs from the HTTP request.
        """
        url_params = url_params or {}
        url = 'https://{0}{1}?'.format(host, urllib.parse.quote(path.encode('utf8')))

        consumer = oauth2.Consumer(self.consumer_key, self.consumer_secret)
        oauth_request = oauth2.Request(
            method="GET", url=url, parameters=url_params)

        oauth_request.update(
            {
                'oauth_nonce': oauth2.generate_nonce(),
                'oauth_timestamp': oauth2.generate_timestamp(),
                'oauth_token': self.token,
                'oauth_consumer_key': self.consumer_key
            }
        )
        token = oauth2.Token(self.token, self.token_secret)
        oauth_request.sign_request(
            oauth2.SignatureMethod_HMAC_SHA1(), consumer, token)
        signed_url = oauth_request.to_url()

        with urllib.request.urlopen(signed_url, None) as httpresponse:
            response = json.loads(httpresponse.read().decode('utf-8'))

        return response


    def _search(self, term, location):
        """Query the Search API by a search term and location.

        Args:
            term (str): The search term passed to the API.
            location (str): The search location passed to the API.

        Returns:
            dict: The JSON response from the request.
        """

        url_params = {
            'term': term.replace(' ', '+'),
            'location': location.replace(' ', '+'),
            'limit': SEARCH_LIMIT
        }
        return self._request(API_HOST, SEARCH_PATH, url_params=url_params)


    def _get_business(self, business_id):
        """Query the Business API by a business ID.

        Args:
            business_id (str): The ID of the business to query.

        Returns:
            dict: The JSON response from the request.
        """
        business_path = BUSINESS_PATH + business_id

        return self._request(API_HOST, business_path)


    def _query_api(self, term, location):
        """Queries the API by the input values from the user.

        Args:
            term (str): The search term to query.
            location (str): The location of the business to query.
        """
        response = self._search(term, location)
        businesses = response.get('businesses')

        if not businesses:
            print(u'No businesses for {0} in {1} found.'.format(term, location))
            return

        business_id = businesses[0]['id']
        response = self._get_business(business_id)

        return response

    def get_rating(self, name, location):
        business = self._query_api(name, location)

        if business is not None:
            return business['rating']
        else:
            return None


@app.route('/')
def home():
    return 'Yelp API Gateway'


@app.route('/yelp')
def search_yelp():
    name = req.args.get('business_name', None)
    location = req.args.get('location', None)
    if name is None:
        return "param: name not specified"
    if location is None:
        return "param: location not specified"

    rating = yelp_client.get_rating(name, location)

    if rating is not None:
        return jsonify({'rating': rating})
    else:
        return "no businesses found"

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('-s', '--server', dest='server', default=None,
                        type=str, help='Server where this is running')
    parser.add_argument('-d', '--debug', dest='debug', default=False,
                        type=bool, help='Debug mode')
    input_values = parser.parse_args()

    # if the server is heroku then load secrets from heroku config vars
    if input_values.server == 'heroku':
        key = os.environ['YELP_CONSUMER_KEY']
        secret = os.environ['YELP_CONSUMER_SECRET']
        token = os.environ['YELP_TOKEN']
        token_secret = os.environ['YELP_TOKEN_SECRET']
        yelp_client = Yelp(key, secret, token, token_secret)
        port = int(os.environ['PORT'])
        app.run(host='0.0.0.0', port=port)

    else:
        # else load from a keyfile for running locally
        with open('keyfile', 'r') as f:
            key = f.readline().strip()
            secret = f.readline().strip()
            token = f.readline().strip()
            token_secret = f.readline().strip()
        app.run(debug=input_values.debug)


