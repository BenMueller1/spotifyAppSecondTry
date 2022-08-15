import {SPOTIFY_BASE_URL, API_URL} from '../../../constants/constants'
import React, { useEffect, useState } from 'react';
import { Pie } from "react-chartjs-2"
import { Chart, registerables } from 'chart.js';
import axios from 'axios'
Chart.register(...registerables);

// EXPLANATION:
// when I change isBusy from true to false, the component will re-render (bc state has changed)
// this is how I only render the chart once I am sure that the data has been fetched

// access_token should be passed in by App as a prop
function ExplicitPie(props) {
    // get props
    const access_token = props["access_token"]
    // initialize state as empty
    const [isBusy, setBusy] = useState(true);
    const [state, setState] = useState({})

    // use effect hook to call functions to get and generate data (don't forget [] so it's only called on first render)
    useEffect(() => {
        const fetchAndProcessData = async () => {
            const top_fifty = props["top_fifty"] // true: compute for top 50 songs, false: compute for all saved songs
            let explicitPieChartData = {"graph_data": {}}
            if (!top_fifty) {
                const all_saved_tracks = await get_users_saved_tracks(access_token)
                explicitPieChartData = await generate_explicitPieChartData(all_saved_tracks)
            }
            else {
                const returned_data = await get_users_top_items("tracks", 50, "long_term", access_token)
                const songs = returned_data['items']
                explicitPieChartData = await generate_explicitPieChartData(songs)
            }
            // set the state equal to the new data inside of this function
            setState({"graph_data": explicitPieChartData})
            setBusy(false)
        }

        fetchAndProcessData()
    }, []) // [] makes it so that it is only run on the first render (and not every successive rendering)

    // don't forget to create options object if needed (could make a generate function if I want)
    // now pass the data and the options to the correct react-chartjs-2 component 
    if (isBusy) {
        return (
            <div id="ExplicitPie" style={{width:"300px", height:"300px"}}>
                <h4>fetching data...</h4>
            </div>
        )
    }
    else {
        return (
            <div id="ExplicitPie" style={{width:"300px", height:"300px"}}>
                <Pie data={state["graph_data"]}/>
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

export default ExplicitPie


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