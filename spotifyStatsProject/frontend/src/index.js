import React from 'react';
import ReactDOM from 'react-dom/client';
import './static/index.css';
import App from './components/App';

import axios from 'axios';

import "bootstrap/dist/css/bootstrap.min.css";

const API_URL = "http://localhost:8000/api"  // this is the link to my api, update as needed (will need to update if I publish)
const SPOTIFY_BASE_URL = "https://api.spotify.com/v1/me"

document.addEventListener('DOMContentLoaded', async () => {
  await get_auth_url()

  // if we have just been redirected to this page from the authorization callback function, this will get the user's current token
  const most_recent_token = await axios.get(API_URL + '/get-most-recently-added-token').then(response => response.data)
  // most_recent_token will be a json object with fields id, created_at, refresh_token, access_token, token_type, expires_in
  // or if there are no tokens in database the promise will return with status 404 and the only field in most_recent_token will be a field called error
  const access_token = most_recent_token['access_token']
  document.getElementById('display_token').innerHTML += access_token
  document.getElementById('top_songs_or_artists').onclick = async () => {
    const returned_data = await get_users_top_items("artists", 50, "long_term", access_token)

    // this is an array of JS objects, each one is information on an artist 
    // (some fields in these objects: "name", "popularity" [int representing popularity of artist worldwide], 'uri', 'external_urls' [object]
    // "images" [ array of images of artist ], "followers" [int], "genres" [array], )
    const artists = returned_data['items'] 

    const top_n_genres = get_top_n_genres(artists, 10)
  }
  // check if most_recent_token doesn't have a field called error, if this is true we can extract the access & refresh tokens out of it
})




const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);



async function get_auth_url() {
  const spotify_auth_url = await axios.get(API_URL + '/get-auth-url').then(response => response.data['url'])  // did I use the right syntax to get the url?
  let spotify_login_link = document.getElementById('spotify_login')
  spotify_login_link.href = spotify_auth_url
}


// NOTE: should probably move these to effect hooks in the root component (once I get these working & then make the root component)

// return the top artists or tracks from user
async function get_users_top_items(category, num_items, time_range, access_token) {
  // category is a string, either "artists" to retrieve top artists or "tracks" to get top tracks
  // num items is integer between 1 and 50
  // time_range is a string, "long_term" (all time), "medium_term" (6 months), "short_term" (4 weeks)
  const auth_code = "Bearer " +  access_token
  const api_link = SPOTIFY_BASE_URL + `/top/${category}`
  const items = await axios.get(api_link, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': auth_code
    },
    params: {
      "limit": num_items,
      "time_range": time_range
    }
  })
  .then(response => response.data)
  return items
}

function get_top_n_genres(artists, n) {
  // takes in the list of artists that is returned by spotify
  // returns an object with the most common n genres and the number of times they occur

  // we will put every occurrence of every genre in an array, then we will go through and count the most common ones
  let genre_strings = new Array(0)
  artists.forEach(artist => {
    let genres = artist["genres"] // this will be an array
    genre_strings.push(...genres) // the spread syntax makes it so this line behaves like python's arr.extend(lst)
  })

  let genre_counts = {} // maps genre to number of times it occurs
  genre_strings.forEach(genre => {
    if (genre_counts[genre]) {
      genre_counts[genre] += 1
    }
    else {
      genre_counts[genre] = 1
    }
  })

  console.log(genre_counts)

  // now I just need to figure out a way to return the n genres with highest occurrences in genre_counts
  let top_n_genres = {}
  let genre_occurrences = Object.values(genre_counts)
  
  for (let i = 0; i < n; i++) {
    let cur_max_val = Math.max(...genre_occurrences) // get current max
    let max_ind = genre_occurrences.indexOf(cur_max_val) // get index of max
    genre_occurrences.splice(max_ind, 1) // remove max val
    // now loop through and find the genre associated with current max value, then add it to top_n_genres
    let genre_keys = Object.keys(genre_counts)
    genre_keys.forEach(gen => {
      if (genre_counts[gen] === cur_max_val) {
        top_n_genres[gen] = cur_max_val
      }
    })
  }

  console.log(top_n_genres)
  return top_n_genres
}