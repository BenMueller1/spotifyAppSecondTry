import {SPOTIFY_BASE_URL, API_URL} from '../../constants/constants'
import React, { useEffect, useState } from 'react';
import { Bar } from "react-chartjs-2"
import { Chart, registerables } from 'chart.js';
import axios from 'axios'
Chart.register(...registerables);

// access_token should be passed in by App as a prop
function PopBar(props) {
    // get props
    const access_token = props["access_token"]
    const artists_bool = props["artists_bool"] // true: get popularities of top 50 artists, false: get popularities of top 50 songs

    // initialize state as empty
    const [isBusy, setBusy] = useState(true)
    const [state, setState] = useState({})

    // use effect hook to call functions to get and generate data (don't forget [] so it's only called on first render)
    useEffect(() => {
        const fetchAndProcessData = async () => {
            let popBarData = {}
            let popBarOptions = get_pop_bar_options()
            let popularities = {}
            if (artists_bool) {
                const returned_data = await get_users_top_items("artists", 50, "long_term", access_token)
                const artists = returned_data['items']
                popularities = await get_artists_popularities(artists)
            }
            else {
                const returned_data = await get_users_top_items("tracks", 50, "long_term", access_token)
                const songs = returned_data['items']
                popularities = await get_songs_popularities(songs)
            }
            popBarData = await generate_popularitiesChartData(popularities)
            // set the state equal to the new data inside of this function
            setState({"graph_data": popBarData, "graph_options": popBarOptions})
            setBusy(false)
        }

        fetchAndProcessData()
    }, [])


    // now pass the data and the options to the correct react-chartjs-2 component 
    if (isBusy) {
        return (
            <div id="PopBar" style={{width:"500px"}}>
                <h4>fetching data...</h4>
            </div>
        )
    }
    else {
        return (
            <div id="PopBar" style={{width:"500px"}}>
                <Bar data={state["graph_data"]} options={state["graph_options"]}/>
            </div>
        )
    }
}

function get_pop_bar_options() {
    return {
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


export default PopBar