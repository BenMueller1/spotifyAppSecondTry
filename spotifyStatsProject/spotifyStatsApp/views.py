from django.shortcuts import render
from django.utils import timezone
from django.http import HttpResponseRedirect

from rest_framework.response import Response
from rest_framework.renderers import JSONRenderer
from rest_framework.decorators import api_view
from rest_framework import status

from .models import SpotifyToken
from .serializers import SpotifyTokenSerializer
from .certs import REDIRECT_URI, CLIENT_ID, CLIENT_SECRET

from requests import Request, post
from datetime import timedelta

FRONTEND_SERVER_LINK = "http://localhost:3000"

@api_view(['GET'])
def get_auth_url(request, format=None):
    ''' returns the url that we should send the user to to login to spotify '''
    ''' in the spotify diagram, this is the first block in application column '''

    scopes = 'user-read-recently-played user-top-read user-library-read user-follow-read user-read-private playlist-read-collaborative'

    # get the url that we can go to to authenticate our spotify application
    url = Request('GET', 'https://accounts.spotify.com/authorize', params={
        "client_id": CLIENT_ID,
        'scope': scopes,
        'response_type': 'code', # we are requesting a code that allows us to authenticate the user
        'redirect_uri': REDIRECT_URI
    }).prepare().url

    response_dict = {'url': url}
    return Response(response_dict, status=status.HTTP_200_OK)


@api_view(["GET"])
def callback_to_get_token(request, format=None):
    # make sure I understand the following comments!!!!!!
    ''' in the spotify diagram, this is equal to the second block in the application column'''
    ''' we make a GET request to this using the link provided by get_auth_url '''
    ''' then this endpoint makes a POST request to the spotify accounts service, which returns the access and refresh tokens '''
    ''' this view then saves the access and refresh tokens to our database before returning them to the frontend '''
    
    code = request.GET.get('code')  # retrieves the code from the URL that we made the get request to (spotify added this code when they returned the url in body of get_auth_url)
    error = request.GET.get('error')

    json_response_with_tokens = post('https://accounts.spotify.com/api/token', data={
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': REDIRECT_URI,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET
    }).json() # convert the response to json

    access_token = json_response_with_tokens.get('access_token')
    token_type = json_response_with_tokens.get('token_type')
    expires_in = timezone.now() + timedelta(seconds = json_response_with_tokens.get('expires_in'))  # typically this is one hour from the current time
    refresh_token = json_response_with_tokens.get('refresh_token')
    error = json_response_with_tokens.get('error')

    # create a new SpotifyToken model instance
    new_token = SpotifyToken(access_token=access_token, token_type=token_type, expires_in=expires_in, refresh_token=refresh_token)
    new_token.save()

    # TODO I LITERALLY JUST NEED TO FIGURE OUT HOW TO MAKE THIS REDIRECT WORK AND THEN I'M GOLDEN!
    return HttpResponseRedirect(FRONTEND_SERVER_LINK)

    

@api_view(["GET"])
def get_most_recently_added_token(request):
    try: 
        token = SpotifyToken.objects.latest('id')
    except:
        return Response({'error': 'no tokens in database'}, status.HTTP_404_NOT_FOUND)

    token_serialized = SpotifyTokenSerializer(token)  # if my serializer isn't working, just make and use a serializer() function in the SpotifyToken model
    token_json = JSONRenderer().render(token_serialized.data)

    return Response(token_json, status=status.HTTP_200_OK)
