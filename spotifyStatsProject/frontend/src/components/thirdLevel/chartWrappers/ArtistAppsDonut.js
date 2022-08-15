import {SPOTIFY_BASE_URL, API_URL} from '../../../constants/constants'
import React, { useEffect, useState } from 'react';
import { Doughnut, Pie } from "react-chartjs-2"
import { Chart, registerables } from 'chart.js';
import axios from 'axios'
Chart.register(...registerables);


// access_token should be passed in by App as a prop
// don't forget to add the ability to only select artists that appear n or more times (should be passed in as a prop)
function ArtistAppsDonut(props) {
    // get props
    let access_token = props["access_token"]
    const top_fifty = props["top_fifty"] // true: compute for top 50 songs, false: compute for all saved songs

    // initialize state as empty
    const [isBusy, setBusy] = useState(true);
    const [state, setState] = useState({})

    // use effect hook to call functions to get and generate data (don't forget [] so it's only called on first render)
    useEffect(() => {
        const fetchAndProcessData = async () => {
            const artistsDonutChartOptions = {plugins: {legend: {display: false}}}
            let artistAppsDonutData = {}
            if (!top_fifty) {
                const all_saved_tracks = await get_users_saved_tracks(access_token)
                artistAppsDonutData = await generate_artistsDonutChart(all_saved_tracks, 3) 
            }
            else {
                const returned_data = await get_users_top_items("tracks", 50, "long_term", access_token)
                const songs = returned_data['items']
                artistAppsDonutData = await generate_artistsDonutChart(songs, 0) 
            }
            // set the state equal to the new data inside of this function
            setState({"graph_data": artistAppsDonutData, "options": artistsDonutChartOptions})
            setBusy(false)
        }

        fetchAndProcessData()
    }, []) // [] makes it so that it is only run on the first render (and not every successive rendering)

    // don't forget to create options object if needed (could make a generate function if I want)

    // now pass the data and the options to the correct react-chartjs-2 component 
    if (isBusy) {
        return (
            <div id="ArtistAppsDonut" style={{width:"300px", height:"300px"}}>
                <h4>fetching data...</h4>
            </div>
        )
    } 
    else {
        return (
            <div id="ArtistAppsDonut" style={{width:"300px", height:"300px"}}>
                <Doughnut data={state["graph_data"]} options={state["options"]}/>
            </div>
        )
    }
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


export default ArtistAppsDonut
