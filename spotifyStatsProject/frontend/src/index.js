import React from 'react';
import ReactDOM from 'react-dom/client';
import './static/index.css';
import App from './components/App';

import axios from 'axios';

import "bootstrap/dist/css/bootstrap.min.css";
import 'chart.js/auto';

import { API_URL } from './constants/constants';

import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);


var root = ReactDOM.createRoot(document.getElementById('root'));

document.addEventListener('DOMContentLoaded', async () => {
  // get the authorization url
  await get_auth_url()

  // if not logged in, we don;t want to display the App
  document.getElementById("content_if_logged_in").style.display = "none"

  // checking if user has logged in
  document.getElementById("spotify_login").onclick =  () => {
    window.sessionStorage.setItem('loggedIn', 'true')
  }
  document.getElementById("spotify_logout").onclick = () => {
    window.sessionStorage.setItem('loggedIn', 'false')
  }

  // if logged in, get the access token and display the app
  if (window.sessionStorage.getItem('loggedIn') === 'true') {
    document.getElementById("spotify_login").style.display = "none"
    document.getElementById("content_if_logged_in").style.display = "inline"
    
    // if we have access token, render app
    if (window.sessionStorage.getItem("access_token")) {
      const access_token = window.sessionStorage.getItem("access_token")
      root.render(
        <div>
          <App access_token={access_token} root={root}/>
        </div>
      )
    }
    else { // if we don't have access token, get it, save it, and render app
      const most_recent_token = await axios.get(API_URL + '/get-most-recently-added-token').then(response => response.data)
      const access_token = most_recent_token['access_token']

      window.sessionStorage.setItem('access_token', access_token)

      root.render(
        <div>
          <App access_token={access_token} root={root}/>
        </div>
      )
    }
    
  }
})



async function get_auth_url() {
  const spotify_auth_url = await axios.get(API_URL + '/get-auth-url').then(response => response.data['url'])  // did I use the right syntax to get the url?
  let spotify_login_link = document.getElementById('spotify_login')
  spotify_login_link.href = spotify_auth_url
}



