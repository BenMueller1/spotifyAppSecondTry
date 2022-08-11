import React from 'react';
import ReactDOM from 'react-dom/client';
import './static/index.css';
import App from './components/App';

import axios from 'axios';

import "bootstrap/dist/css/bootstrap.min.css";

const API_URL = "http://localhost:8000/api"  // this is the link to my api, update as needed (will need to update if I publish)


document.addEventListener('DOMContentLoaded', async () => {
  const spotify_auth_url = await axios.get(API_URL + '/get-auth-url').then(response => response.data['url'])  // did I use the right syntax to get the url?
  let spotify_login_link = document.getElementById('spotify_login')
  spotify_login_link.href = spotify_auth_url

  // if we have just been redirected to this page from the authorization callback function, this will get the user's current token
  const most_recent_token = await axios.get(API_URL + '/get-most-recently-added-token').then(response => response.json())
  // most_recent_token will be a json object with fields id, created_at, refresh_token, accessS_token, token_type, expires_in
  // or if there are no tokens in database the promise will return with status 404 and the only field in most_recent_token will be a field called error
  console.log(most_recent_token)
  // check if most_recent_token doesn't have a field called error, if this is true we can extract the access & refresh tokens out of it
})




const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);