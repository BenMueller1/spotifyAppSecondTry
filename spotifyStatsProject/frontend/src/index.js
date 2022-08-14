import React from 'react';
import ReactDOM from 'react-dom/client';
import './static/index.css';
import App from './components/App';

import PriorityQueue from './dataStructures/pq';

import axios from 'axios';

import "bootstrap/dist/css/bootstrap.min.css";
import 'chart.js/auto';
import { PolarArea, Doughnut, Bar, Pie, Radar } from "react-chartjs-2"
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
  console.log(window.sessionStorage)
  document.getElementById("content_if_logged_in").style.display = "none"

  document.getElementById("spotify_login").onclick =  () => {
    // This might only work if I use localStorage
    window.sessionStorage.setItem('loggedIn', 'true')
  }

  document.getElementById("spotify_logout").onclick = () => {
    window.sessionStorage.setItem('loggedIn', 'false')
  }

  if (window.sessionStorage.getItem('loggedIn') === 'true') {
    document.getElementById("spotify_login").style.display = "none"
    document.getElementById("content_if_logged_in").style.display = "inline"
    // if we have just been redirected to this page from the authorization callback function, this will get the user's current token
    const most_recent_token = await axios.get(API_URL + '/get-most-recently-added-token').then(response => response.data)
    // most_recent_token will be a json object with fields id, created_at, refresh_token, access_token, token_type, expires_in
    // or if there are no tokens in database the promise will return with status 404 and the only field in most_recent_token will be a field called error
    const access_token = most_recent_token['access_token']
    //document.getElementById('display_token').innerHTML += access_token
    document.getElementById('top_artists').onclick = async () => await get_and_render_top_artists_data(access_token)
    document.getElementById('top_songs').onclick = async () => await get_and_render_top_songs_data(access_token)
    document.getElementById('saved_tracks').onclick = async () => await get_and_render_saved_tracks_data(access_token)
    // check if most_recent_token doesn't have a field called error, if this is true we can extract the access & refresh tokens out of it
  }
})

async function get_and_render_saved_tracks_data(access_token) {
  document.getElementById("top_fifty").innerHTML = "" // clear these out if switching from different data

  const all_saved_tracks = await get_users_saved_tracks(access_token)
  console.log(all_saved_tracks)

  const explicitPieChartData = await generate_explicitPieChartData(all_saved_tracks)

  const artistsDonutChartData = await generate_artistsDonutChart(all_saved_tracks, 3) 
  const artistsDonutChartOptions = {plugins: {legend: {display: false}}}

  const averages = await calculate_averages_for_all_saved_tracks(access_token, all_saved_tracks)
  const averagesRadarChartData = await generate_radarChartData(averages)
  const averagesRadarChartOptions = {
    elements: {
      line: {
        borderWidth: 3
      }
    },
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      r: {
        max: 1,
        min: 0,
        ticks: {
          stepSize: 0.2
        }
      }
    }
  }

  root.render(
    <div>
      <App />
      <p> average song stats </p>
      <div id="average_stats" style={{width:"600px", height:"600px"}}>
        <Radar data={averagesRadarChartData} options={averagesRadarChartOptions} />
      </div>
      <br></br>
      <p> artists that appear 3 or more times </p>
      <div id="artists_that_appear_n_times" style={{width:"300px", height:"300px"}}>
        <Doughnut data={artistsDonutChartData} options={artistsDonutChartOptions} />
      </div>
      <br></br>
      <p> explicitness </p>
      <div id="explicitness" style={{width:"300px", height:"300px"}}>
        <Pie data={explicitPieChartData}/>
      </div>
      <br></br>
    </div>
  )
}

async function get_and_render_top_songs_data(access_token) {
  document.getElementById("top_fifty").innerHTML = "" // clear this out if we are switching from different data

  const returned_data = await get_users_top_items("tracks", 50, "long_term", access_token)

  // this is an array of JS objects, each one is information on a song
  const songs = returned_data['items']
  console.log(songs)

  const artistsDonutChartData = await generate_artistsDonutChart(songs, 0) 
  const artistsDonutChartOptions = {plugins: {legend: {display: false}}}
  
  const popularities = await get_songs_popularities(songs)
  const songPopularitiesChartData = await generate_popularitiesChartData(popularities)

  const explicitPieChartData = await generate_explicitPieChartData(songs)

  const averages = await calculate_average_stats(access_token, songs)
  const averagesRadarChartData = await generate_radarChartData(averages)
  const averagesRadarChartOptions = {
    elements: {
      line: {
        borderWidth: 3
      }
    },
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      r: {
        max: 1,
        min: 0,
        ticks: {
          stepSize: 0.2
        }
      }
    }
  }

  console.log(averages)
  // options allow us to hide labels on popularity bar chart
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

  const song_names_with_artists = Object.keys(popularities)
  generate_top_fifty_list(song_names_with_artists)

  root.render(
    <div>
      <App />
      <p> average song stats </p>
      <div id="average_stats" style={{width:"600px", height:"600px"}}>
        <Radar data={averagesRadarChartData} options={averagesRadarChartOptions} />
      </div>
      <br></br>
      <p> artists' appearences in top 50 songs </p>
      <div id="artists_in_top_fifty_songs" style={{width:"300px", height:"300px"}}>
        <Doughnut data={artistsDonutChartData} options={artistsDonutChartOptions} />
      </div>
      <br></br>
      <p> global popularities of songs in your all time top 50: </p>
      <div id="popularities_bar_chart" style={{width:"500px"}}>
        <Bar options={popularities_chart_options} data={songPopularitiesChartData}/>
      </div>
      <br></br>
      <p> explicitness </p>
      <div id="explicitness" style={{width:"300px", height:"300px"}}>
        <Pie data={explicitPieChartData}/>
      </div>
      <br></br>
    </div>
  );
}

async function get_and_render_top_artists_data(access_token)  {
  document.getElementById("top_fifty").innerHTML = "" // clear this out if we are switching from different data

  const returned_data = await get_users_top_items("artists", 50, "long_term", access_token)

  // this is an array of JS objects, each one is information on an artist 
  const artists = returned_data['items'] 
  console.log(artists)

  const top_n_genres = await get_top_n_genres(artists, 9) 
  const genresPolarChartData = await generate_genresPolarChartData(top_n_genres)

  const artists_ordered_by_follower_count = await get_artists_ordered_by_followers(artists)
  const highestFollowerCountBarChartData = await generate_followerCountBarChartData(artists_ordered_by_follower_count, "top")
  const lowestFollowerCountBarChartData = await generate_followerCountBarChartData(artists_ordered_by_follower_count, "bottom")

  const popularities = await get_artists_popularities(artists)  // returns an object that maps each artist to their popularity score
  const popularitiesChartData = await generate_popularitiesChartData(popularities)

  const names = Object.keys(popularities)  // just the names of top 50 artists
  generate_top_fifty_list(names)
  
  // options allow us to hide labels on popularity bar chart
  const bar_chart_options = {
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
        <Bar options={bar_chart_options} data={popularitiesChartData}/>
      </div>
      <br></br>
      <p> top 10 most followed in your top 50 artists </p>
      <div id="follower_counts_bar_chart" style={{width:"500px"}}>
        <Bar options={bar_chart_options} data={highestFollowerCountBarChartData}/>
      </div>
      <br></br>
      <p> top 10 least followed in your top 50 artists </p>
      <div id="follower_counts_bar_chart" style={{width:"500px"}}>
        <Bar options={bar_chart_options} data={lowestFollowerCountBarChartData}/>
      </div>
    </div>
  );
}


async function get_auth_url() {
  const spotify_auth_url = await axios.get(API_URL + '/get-auth-url').then(response => response.data['url'])  // did I use the right syntax to get the url?
  let spotify_login_link = document.getElementById('spotify_login')
  spotify_login_link.href = spotify_auth_url
}


async function get_users_saved_tracks(access_token) {
  // to get all saved tracks, need to keep making api calls until there are no more 
  // if offset is higher than the number of saved tracks it will return an empty array
  //    once this happens we should return
  const auth_code = "Bearer " +  access_token
  const api_link = SPOTIFY_BASE_URL + `/tracks`

  let offset = 0
  let finished = false
  let all_tracks = new Array(0)

  while (!finished) {
    const tracks = await axios.get(api_link, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': auth_code
      },
      params: {
        "limit": 50,
        "offset": offset
      }
    })
    .then(response => response.data)
    .then(response_data => response_data["items"])
    .then(items => {
      return items.map(item => item["track"])
    })

    if (tracks.length === 0) {
      finished = true
    }
    else {
      offset += 50
      all_tracks.push(...tracks)
    }
  }
  
  return all_tracks
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

async function get_songs_popularities(songs) {
  // same as get_artists_popularities, only we have to extract the song name and the artists
  let popularities = {} // will map a string with song artists and name to its popularity score
  songs.forEach(song => {
    let name = song["name"]
    let popularity = Math.max(song["popularity"], 1) // if pop is 0, it won't show up at all on bar chart
    let artists = song["artists"]
    let label_string = ""
    artists.forEach(artist => {
      label_string += `${artist["name"]}, `
    })
    label_string = label_string.slice(0, label_string.length - 2)  // cut off the last two characters bc there will be an extra space and comma
    label_string += ` - ${name}`
    popularities[label_string] = popularity
  })
  return popularities
}

async function generate_artistsDonutChart(songs, cutoff) {
  // cutoff is an int, only artists with >= cutoff appearences will be put in the chart
  let artist_counts = {} // maps genre to number of times it occurs
  songs.forEach(song => {
    let artists = song["artists"]
    artists.forEach(artist => {
      let name = artist['name']
      if (artist_counts[name]) {
        artist_counts[name] += 1
      }
      else {
        artist_counts[name] = 1
      }
    })
  })

  let new_artist_counts = {}
  Object.keys(artist_counts).forEach(artist => {
    if (artist_counts[artist] >= cutoff) {
      new_artist_counts[artist] = artist_counts[artist]
    }
  })

  // we will need to generate backroundColor array by using a for loop (bc we don't know how many artists there will be ahead of time)
  // I randomly generate background colors
  let backgroundColors = new Array(0)
  for (let i = 0; i < Object.keys(new_artist_counts).length; i++) {
    let random_red = Math.floor(Math.random() * 256)
    let random_blue = Math.floor(Math.random() * 256)
    let random_green = Math.floor(Math.random() * 256)
    backgroundColors.push(`rgba(${random_red}, ${random_blue}, ${random_green}, 0.5)`)
  }
  const chart_data = {
    labels: Object.keys(new_artist_counts),
    datasets: [{
      label: 'Appearences in top 50 songs',
      data: Object.values(new_artist_counts),
      backgroundColor: backgroundColors,
      hoverOffset: 3
    }]
  } 
  return chart_data
} 

async function generate_explicitPieChartData(songs) {
  let explicit_count = 0
  let non_explicit_count = 0

  songs.forEach(song => {
    let explicit = song["explicit"] // boolean: T or F
    if (explicit) {
      explicit_count += 1
    }
    else {
      non_explicit_count += 1
    }
  })

  const chart_data = {
    labels: ['Explicit', 'Clean'],
    datasets: [{
      label: 'Cleanness',
      data: [explicit_count, non_explicit_count],
      backgroundColor: ['rgb(255, 99, 132)', 'rgb(54, 162, 235)'],
      hoverOffset: 4
    }]
  }
  return chart_data
}

async function generate_popularitiesChartData(popularities) {
  let backgroundColors = new Array(0)
  let borderColors = new Array(0)
  for (let i = 0; i < Object.keys(popularities).length; i++) {
    let random_red = Math.floor(Math.random() * 256)
    let random_blue = Math.floor(Math.random() * 256)
    let random_green = Math.floor(Math.random() * 256)
    backgroundColors.push(`rgba(${random_red}, ${random_blue}, ${random_green}, 0.5)`)
    borderColors.push(`rgb(${random_red}, ${random_blue}, ${random_green})`)
  }

  const data = {
    labels: Object.keys(popularities),
    datasets: [{
      label: 'Global Popularity Score',
      data: Object.values(popularities),
      // these next two arrays should have 50 entries (or else error will occur)
      backgroundColor: backgroundColors,
      borderColor: borderColors,
      borderWidth: 1
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



async function get_artists_ordered_by_followers(artists) {
  // uses HEAPSORT to sort return an object of artist to follower count mapping that is in order
  let ordered_by_followers = {}
  var pQ = new PriorityQueue();
  console.log(ordered_by_followers)
  artists.forEach(artist => {
    pQ.enqueue(artist['name'], artist['followers']['total'])
  })
  console.log(pQ.printPQueue())
  while (!pQ.isEmpty()) {
    let cur = pQ.dequeue()
    let name = cur["element"]
    let follower_count = cur["priority"]
    ordered_by_followers[name] = follower_count
    //console.log(ordered_by_followers)
  } 
  console.log(ordered_by_followers)
  return ordered_by_followers
}

async function generate_followerCountBarChartData(artists_ordered_by_follower_count, bottom_or_top) {
  // bottom_or_top could be "bottom" (meaning get the 10 least followed) or "top" (get the 10 most followed)
  let artist_names = new Array(0)
  if (bottom_or_top==="bottom") {
    artist_names = Object.keys(artists_ordered_by_follower_count).slice(0, 10)
  }
  else {
    artist_names = Object.keys(artists_ordered_by_follower_count).slice(40)
  }
  
  let backgroundColors = new Array(0)
  let borderColors = new Array(0)
  for (let i = 0; i < artist_names.length; i++) {
    let random_red = Math.floor(Math.random() * 256)
    let random_blue = Math.floor(Math.random() * 256)
    let random_green = Math.floor(Math.random() * 256)
    backgroundColors.push(`rgba(${random_red}, ${random_blue}, ${random_green}, 0.5)`)
    borderColors.push(`rgb(${random_red}, ${random_blue}, ${random_green})`)
  }

  let follower_counts = new Array(0)
  artist_names.forEach(name => {
    follower_counts.push(artists_ordered_by_follower_count[name])
  })

  const data = {
    labels: artist_names.reverse(),
    datasets: [{
      label: 'Follower Count',
      data: follower_counts.reverse(),
      // these next two arrays should have 50 entries (or else error will occur)
      backgroundColor: backgroundColors,
      borderColor: borderColors,
      borderWidth: 1
    }]
  };
  return data
}

async function calculate_averages_for_all_saved_tracks(access_token, all_saved_tracks) {
  // TODO: get averages of stats for all saved songs
  //   1. split all_saved_tracks into subarrays of size 100 or less
  //   2. call calculate_average_stats on each subarray and save the averages
  //   3. get average of all the averages returned

  // I am so proud of how I made an array of promises here STUDY HOW I DID THIS!!!

  // we have to split into batches because spotify's api can only return data on up to 100 songs at once
  // split into batches of size 100 or less
  let batches_of_one_hundred_songs = new Array(0)
  let temp = new Array(0)
  for (let i = 0; i < all_saved_tracks.length; i++) {
    temp.push(all_saved_tracks[i])
    if (((i+1) % 100) === 0) {
      batches_of_one_hundred_songs.push(temp)
      temp = []
    }
  }
  if (temp.length > 0) {
    batches_of_one_hundred_songs.push(temp)
  }

  let averages = {
    "acousticness": 0,
    "danceability": 0,
    "energy": 0,
    //"instrumentalness": new Array(0),
    //"liveness": new Array(0),
    "mode": 0,
    //"speechiness": new Array(0),
    "valence": 0
  }

  let promises = new Array(0)
  // add up the averages for each batch
  batches_of_one_hundred_songs.forEach(batch => {
    let batch_averages = calculate_average_stats(access_token, batch)
    promises.push(batch_averages)
  })
  
  let averages_for_each_batch = await Promise.all(promises)
  averages_for_each_batch.forEach(batch_averages => {
    averages["acousticness"] += batch_averages["acousticness"]
    averages["danceability"] += batch_averages["danceability"]
    averages["energy"] += batch_averages["energy"]
    averages["mode"] += batch_averages["mode"]
    averages["valence"] += batch_averages["valence"]
  })

  // now we just need to divide each of the sums, and then we have our averages
  let num_batches = batches_of_one_hundred_songs.length
  Object.keys(averages).forEach(stat => {
    averages[stat] /= num_batches
    averages[stat] = Math.round(averages[stat]*100)/100  // this rounds to 2 decimal places
  })
  
  return averages
}




async function calculate_average_stats(access_token, song_list) {
  // returns average of all 9 stats
  //    stats: acousticness, danceability, energy, instrumentalness, liveness, loudness, mode, speechiness, valence
  //    these are all measured on a scale from 0.0 to 1.0 (except loudness, which is why I don't use it)
  //    note: for mode, 1 is major and 0 is minor
  // song_list: list of songs (we will need to use the ID field of each song in the api call)

  const auth_code = "Bearer " +  access_token
  const api_link_base = "https://api.spotify.com/v1/audio-features"   // will need to add each tracks ID for each call

  let averages = {
    "acousticness": new Array(0),
    "danceability": new Array(0),
    "energy": new Array(0),
    //"instrumentalness": new Array(0),
    //"liveness": new Array(0),
    "mode": new Array(0),
    //"speechiness": new Array(0),
    "valence": new Array(0)
  }

  let all_song_ids = ""

  // does the arrow function have to be async?
  song_list.forEach(song => {
    let song_id = song["id"]
    all_song_ids += song_id + ","
  })
  all_song_ids = all_song_ids.slice(0, -1) // bc there will be an extra comma on the end

  await axios.get(api_link_base, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': auth_code
    },
    params: {
      "ids": all_song_ids
    }
  })
  .then(response => response.data["audio_features"])
  .then(audio_features => {
    audio_features.forEach(stats => {
      averages["acousticness"].push(stats["acousticness"])
      averages["danceability"].push(stats["danceability"])
      averages["energy"].push(stats["energy"])
      //averages["instrumentalness"].push(stats["instrumentalness"])
      //averages["liveness"].push(stats["liveness"])
      averages["mode"].push(stats["mode"])
      //averages["speechiness"].push(stats["speechiness"])
      averages["valence"].push(stats["valence"])
    })
  })

  // calculate and return average of each array
  Object.keys(averages).forEach(stat => {
    let avg = get_avg(averages[stat])
    averages[stat] = Math.round(avg*100)/100  // this rounds to 2 decimal places
  })

  return averages
}

async function generate_radarChartData(dat) {
  // dat is a json object
  const graph_data = {
    labels: Object.keys(dat),
    datasets: [{
      label: 'Average value',
      data: Object.values(dat),
      fill: true,
      backgroundColor: 'rgba(30, 215, 96, 0.2)',
      borderColor: 'rgb(30, 215, 96)',
      pointBackgroundColor: 'rgb(30, 215, 96)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgb(30, 215, 96)'
    }]
  }
  return graph_data
}

// helper function to compute average
function get_avg(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length
}
