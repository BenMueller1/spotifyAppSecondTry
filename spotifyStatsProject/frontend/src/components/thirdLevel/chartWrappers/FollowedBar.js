import {SPOTIFY_BASE_URL, API_URL} from '../../../constants/constants'
import React, { useEffect, useState } from 'react';
import { Bar } from "react-chartjs-2"
import PriorityQueue from '../../../dataStructures/pq';
import { Chart, registerables } from 'chart.js';
import axios from 'axios'
Chart.register(...registerables);

// access_token should be passed in by App as a prop
function ExplicitPie(props) {
    // get props
    const top_ten = props["top_ten"] // true: display ten most followed, false: display ten least followed
    const access_token = props["access_token"]

    // initialize state as empty
    const [isBusy, setBusy] = useState(true);
    const [state, setState] = useState({})

    // use effect hook to call functions to get and generate data (don't forget [] so it's only called on first render)
    useEffect(() => {
        const fetchAndProcessData = async () => {
            let followedBarData = {"graph_data": {}}
            const returned_data = await get_users_top_items("artists", 50, "long_term", access_token)
            const artists = returned_data['items'] 
            const artists_ordered_by_follower_count = await get_artists_ordered_by_followers(artists)
            const bar_chart_options = get_bar_chart_options()

            if (top_ten) {
                followedBarData = await generate_followerCountBarChartData(artists_ordered_by_follower_count, "top")
            }
            else {
                followedBarData = await generate_followerCountBarChartData(artists_ordered_by_follower_count, "bottom")
            }

            // set the state equal to the new data inside of this function
            setState({"graph_data": followedBarData, "graph_options": bar_chart_options})
            setBusy(false)
        }

        fetchAndProcessData()
    }, [])
    // don't forget to create options object if needed (could make a generate function if I want)

    // now pass the data and the options to the correct react-chartjs-2 component 
    if (isBusy) {
        <div id="FollowedBar" style={{width:"500px"}}>
            <h4>fetching data...</h4>
        </div>
    }
    else {
        return (
            <div id="FollowedBar" style={{width:"500px"}}>
                <Bar data={state["graph_data"]} options={state["graph_options"]}/>
            </div>
        )
    }
    
}

function get_bar_chart_options() {
    return {
        scales: {
          y: {
            beginAtZero: true
          },
          x: {
            ticks: {
              display: false
            }
          }
        },
        plugins: {
            legend: {
                display: false
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


export default ExplicitPie