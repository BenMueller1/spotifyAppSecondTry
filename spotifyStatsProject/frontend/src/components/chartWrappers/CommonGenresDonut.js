import {SPOTIFY_BASE_URL, API_URL} from '../../constants/constants'
import React, { useEffect, useState } from 'react';
import { Doughnut } from "react-chartjs-2"
import { Chart, registerables } from 'chart.js';
import axios from 'axios'
Chart.register(...registerables);


// access_token should be passed in by App as a prop
function CommonGenresDonut(props) {
    // get props
    const access_token = props["access_token"]
    let num_genres = 0    // int representing the number of genres we want to display (default is 9)
    if (props["num_genres"]) {
        num_genres = props["num_genres"]
    }
    else {
        num_genres = 9
    } 

    // initialize state as empty
    const [isBusy, setBusy] = useState(true)
    const [state, setState] = useState({})

    // use effect hook to call functions to get and generate data (don't forget [] so it's only called on first render)
    useEffect(() => {
        const fetchAndProcessData = async () => {
            let commonGenresDonutData = {}
            const returned_data = await get_users_top_items("artists", 50, "long_term", access_token)
            const artists = returned_data['items'] 
            const top_n_genres = await get_top_n_genres(artists, num_genres)
            commonGenresDonutData = await generate_genresDonutChartData(top_n_genres)

            // set the state equal to the new data inside of this function
            setState({"graph_data": commonGenresDonutData})
            setBusy(false)
        }

        fetchAndProcessData()
    }, [])

    // now pass the data and the options to the correct react-chartjs-2 component 
    if (isBusy) {
        return (
            <div id="CommonGenresDonut" style={{width:"500px", height:"500px"}}>
                <h4>fetching data...</h4>
            </div>
        )
    }
    else {
        return (
            <div id="CommonGenresDonut" style={{width:"500px", height:"500px"}}>
                <Doughnut data={state["graph_data"]}/>
            </div>
        )
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
  
    return top_n_genres
}


async function generate_genresDonutChartData(top_n_genres) {
    const genresDonutChartData = {
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
    return genresDonutChartData
}


export default CommonGenresDonut