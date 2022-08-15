import {SPOTIFY_BASE_URL, API_URL} from '../../../constants/constants'
import React, { useEffect, useState } from 'react';
import { Radar } from "react-chartjs-2"
import { Chart, registerables } from 'chart.js';
import axios from 'axios'
Chart.register(...registerables);

// access_token should be passed in by App as a prop
function ExplicitPie(props) {
    // get props
    const top_fifty = props["top_fifty"] // false: get data on all saved songs, true: get data on top fifty songs
    const access_token = props["access_token"]

    // initialize state as empty
    const [isBusy, setBusy] = useState(true);
    const [state, setState] = useState({})

    // use effect hook to call functions to get and generate data (don't forget [] so it's only called on first render)
    useEffect(() => {
        const fetchAndProcessData = async () => {
            let statsRadarData = {}
            let averages = {}
            let statsRadarOptions = get_stats_radar_options()
            if (top_fifty) {
                const returned_data = await get_users_top_items("tracks", 50, "long_term", access_token)
                const songs = returned_data['items']
                averages = await calculate_average_stats(access_token, songs)
            }
            else {
                const all_saved_tracks = await get_users_saved_tracks(access_token)
                averages = await calculate_averages_for_all_saved_tracks(access_token, all_saved_tracks)
            }
            statsRadarData = await generate_radarChartData(averages)
            // set the state equal to the new data inside of this function
            setState({"graph_data": statsRadarData, "graph_options": statsRadarOptions})
            setBusy(false)
        }

        fetchAndProcessData()
    }, [])

    // don't forget to create options object if needed (could make a generate function if I want)

    // now pass the data and the options to the correct react-chartjs-2 component 
    if (isBusy) {
        return (
            <div id="SongStatsRadar" style={{width:"600px", height:"600px"}}>
                <h4>fetching data...</h4>
            </div>
        )
    }
    else {
        return (
            <div id="SongStatsRadar" style={{width:"600px", height:"600px"}}>
                <Radar data={state["graph_data"]} options={state["graph_options"]}/>
            </div>
        )
    }
    
}


function get_stats_radar_options() {
    return {
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


async function generate_radarChartData(dat) {
    // dat is a json object
  
    // labels shouldnt be hardcoded, I should change it to this line later
    // let labels = Object.values(dat)
    const graph_data = {
      labels: ["acousticness", "danceability", "energy", "mode (1=major, 0=minor)", "valence (1=happy, 0=sad)"],
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

function get_avg(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length
}





export default ExplicitPie