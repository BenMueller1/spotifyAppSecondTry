import React from 'react';
import ReactDOM from 'react-dom/client';
import './static/index.css';
import App from './components/App';

import axios from 'axios';

import "bootstrap/dist/css/bootstrap.min.css";
import 'chart.js/auto';
import { PolarArea, Doughnut, Bar } from "react-chartjs-2"
import PolarAreaChart from './charts/PolarArea'


import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);



const API_URL = "http://localhost:8000/api"  // this is the link to my api, update as needed (will need to update if I publish)
const SPOTIFY_BASE_URL = "https://api.spotify.com/v1/me"

var root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


document.addEventListener('DOMContentLoaded', async () => {
  await get_auth_url()

  // if we have just been redirected to this page from the authorization callback function, this will get the user's current token
  const most_recent_token = await axios.get(API_URL + '/get-most-recently-added-token').then(response => response.data)
  // most_recent_token will be a json object with fields id, created_at, refresh_token, access_token, token_type, expires_in
  // or if there are no tokens in database the promise will return with status 404 and the only field in most_recent_token will be a field called error
  const access_token = most_recent_token['access_token']
  document.getElementById('display_token').innerHTML += access_token
  document.getElementById('top_artists').onclick = async () => await get_and_render_top_artists_data(access_token)
  document.getElementById('top_songs').onclick = async () => await get_and_render_top_songs_data(access_token)
  // check if most_recent_token doesn't have a field called error, if this is true we can extract the access & refresh tokens out of it
})

async function get_and_render_top_songs_data(access_token) {
  const returned_data = await get_users_top_items("tracks", 50, "long_term", access_token)

  // this is an array of JS objects, each one is information on a song
  const songs = returned_data['items']
  console.log(songs)
}

async function get_and_render_top_artists_data(access_token)  {
  const returned_data = await get_users_top_items("artists", 50, "long_term", access_token)

  // this is an array of JS objects, each one is information on an artist 
  const artists = returned_data['items'] 
  console.log(artists)

  const top_n_genres = await get_top_n_genres(artists, 9) 
  const genresPolarChartData = await generate_genresPolarChartData(top_n_genres)

  const popularities = await get_artists_popularities(artists)  // returns an object that maps each artist to their popularity score
  const popularitiesChartData = await generate_popularitiesChartData(popularities)

  const names = Object.keys(popularities)  // just the names of top 50 artists
  generate_top_fifty_list(names)
  
  // options allow us to hide labels
  const popularities_chart_options = {
    scales: {
      y: {
        beginAtZero: false
      },
      x: {
        ticks: {
          display: false
        }
      }
    }
  }
  
  // const pie_chart_div = ReactDOM.createRoot(document.getElementById('genres_pie_chart'));
  root.render(
    <div>
      <App />
      <p> most common genres among your top 50 artists of all time: </p>
      <div id="genres_polar_chart" style={{width:"500px", height:"500px"}}>
        <Doughnut data={genresPolarChartData} /*updateMode="resize"*/ />
      </div>
      <br></br>
      <p> global popularities of artists in your all time top 50: </p>
      <div id="popularities_bar_chart" style={{width:"500px"}}>
        <Bar options={popularities_chart_options} data={popularitiesChartData}/>
      </div>
    </div>
  );
}


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

async function get_top_n_genres(artists, n) {
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


async function generate_genresPolarChartData(top_n_genres) {
  const genresPolarChartData = {
    labels: Object.keys(top_n_genres),
    datasets: [{
      label: 'Most Popular Genres from Top 50 Artists',
      data: Object.values(top_n_genres),
      backgroundColor: [
        'rgba(255, 99, 132, 0.5)',
        'rgba(54, 162, 235, 0.5)',
        'rgba(255, 206, 86, 0.5)',
        'rgba(75, 192, 192, 0.5)',
        'rgba(153, 102, 255, 0.5)',
        'rgba(255, 159, 64, 0.5)',
        'rgba(244, 192, 0, 0.5)',
        'rgba(153, 0, 255, 0.5)',
        'rgba(0, 159, 34, 0.5)',
      ],
      hoverOffset: 3,
    }]
  };
  return genresPolarChartData
}


async function get_artists_popularities(artists) {
  let popularities = {} // maps artist name to popularity score
  artists.forEach(artist => {
    let name = artist['name']
    let popularity = artist['popularity']
    popularities[name] = popularity
  })
  return popularities
}

async function generate_popularitiesChartData(popularities) {
  const data = {
    labels: Object.keys(popularities),
    datasets: [{
      label: 'Popularity Score',
      data: Object.values(popularities),
      // these next two arrays should have 50 entries (or else error will occur)
      backgroundColor: [
        'rgba(255, 99, 132, 0.2)',
        'rgba(255, 159, 64, 0.2)',
        'rgba(255, 205, 86, 0.2)',
        'rgba(75, 192, 192, 0.2)',
        'rgba(54, 162, 235, 0.2)',
        'rgba(153, 102, 255, 0.2)',
        'rgba(255, 99, 132, 0.2)',
        'rgba(255, 159, 64, 0.2)',
        'rgba(255, 205, 86, 0.2)',
        'rgba(75, 192, 192, 0.2)',
        'rgba(54, 162, 235, 0.2)',
        'rgba(153, 102, 255, 0.2)',
        'rgba(255, 99, 132, 0.2)',
        'rgba(255, 159, 64, 0.2)',
        'rgba(255, 205, 86, 0.2)',
        'rgba(75, 192, 192, 0.2)',
        'rgba(54, 162, 235, 0.2)',
        'rgba(153, 102, 255, 0.2)',
        'rgba(255, 99, 132, 0.2)',
        'rgba(255, 159, 64, 0.2)',
        'rgba(255, 205, 86, 0.2)',
        'rgba(75, 192, 192, 0.2)',
        'rgba(54, 162, 235, 0.2)',
        'rgba(153, 102, 255, 0.2)',
        'rgba(255, 99, 132, 0.2)',
        'rgba(255, 159, 64, 0.2)',
        'rgba(255, 205, 86, 0.2)',
        'rgba(75, 192, 192, 0.2)',
        'rgba(54, 162, 235, 0.2)',
        'rgba(153, 102, 255, 0.2)',
        'rgba(255, 99, 132, 0.2)',
        'rgba(255, 159, 64, 0.2)',
        'rgba(255, 205, 86, 0.2)',
        'rgba(75, 192, 192, 0.2)',
        'rgba(54, 162, 235, 0.2)',
        'rgba(153, 102, 255, 0.2)',
        'rgba(255, 99, 132, 0.2)',
        'rgba(255, 159, 64, 0.2)',
        'rgba(255, 205, 86, 0.2)',
        'rgba(75, 192, 192, 0.2)',
        'rgba(54, 162, 235, 0.2)',
        'rgba(153, 102, 255, 0.2)',
        'rgba(255, 99, 132, 0.2)',
        'rgba(255, 159, 64, 0.2)',
        'rgba(255, 205, 86, 0.2)',
        'rgba(75, 192, 192, 0.2)',
        'rgba(54, 162, 235, 0.2)',
        'rgba(153, 102, 255, 0.2)',
        'rgba(255, 99, 132, 0.2)',
        'rgba(255, 159, 64, 0.2)'
      ],
      borderColor: [
        'rgb(255, 99, 132)',
        'rgb(255, 159, 64)',
        'rgb(255, 205, 86)',
        'rgb(75, 192, 192)',
        'rgb(54, 162, 235)',
        'rgb(153, 102, 255)',
        'rgb(255, 99, 132)',
        'rgb(255, 159, 64)',
        'rgb(255, 205, 86)',
        'rgb(75, 192, 192)',
        'rgb(54, 162, 235)',
        'rgb(153, 102, 255)',
        'rgb(255, 99, 132)',
        'rgb(255, 159, 64)',
        'rgb(255, 205, 86)',
        'rgb(75, 192, 192)',
        'rgb(54, 162, 235)',
        'rgb(153, 102, 255)',
        'rgb(255, 99, 132)',
        'rgb(255, 159, 64)',
        'rgb(255, 205, 86)',
        'rgb(75, 192, 192)',
        'rgb(54, 162, 235)',
        'rgb(153, 102, 255)',
        'rgb(255, 99, 132)',
        'rgb(255, 159, 64)',
        'rgb(255, 205, 86)',
        'rgb(75, 192, 192)',
        'rgb(54, 162, 235)',
        'rgb(153, 102, 255)',
        'rgb(255, 99, 132)',
        'rgb(255, 159, 64)',
        'rgb(255, 205, 86)',
        'rgb(75, 192, 192)',
        'rgb(54, 162, 235)',
        'rgb(153, 102, 255)',
        'rgb(255, 99, 132)',
        'rgb(255, 159, 64)',
        'rgb(255, 205, 86)',
        'rgb(75, 192, 192)',
        'rgb(54, 162, 235)',
        'rgb(153, 102, 255)',
        'rgb(255, 99, 132)',
        'rgb(255, 159, 64)',
        'rgb(255, 205, 86)',
        'rgb(75, 192, 192)',
        'rgb(54, 162, 235)',
        'rgb(153, 102, 255)',
        'rgb(255, 99, 132)',
        'rgb(255, 159, 64)'
      ],
      borderWidth:1
    }]
  };
  return data
}


function generate_top_fifty_list(names) {
  var names_div = document.getElementById("top_fifty")
  names_div.innerHTML += '<ol id="top_fifty_list"></ol>'
  var ol = document.getElementById("top_fifty_list")
  names.forEach((name, i) => {
    ol.innerHTML += `<li key=${i+1}>${name}</li>`
  })
}