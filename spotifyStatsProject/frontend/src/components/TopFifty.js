import {SPOTIFY_BASE_URL, API_URL} from '../constants/constants'
import React, { useEffect, useState } from 'react';
import axios from 'axios'

// FIND A CSS FRAMEWORK WITH REALLY NICE LISTS

function TopFifty(props) {
    // get props
    let access_token = props["access_token"]
    let songs_bool = props["songs_bool"] // true: show top 50 songs, false: show top 50 artists

    // initialize state
    const [isBusy, setBusy] = useState(true);
    const [state, setState] = useState({})

    // use effect hook to call functions to get and generate data (don't forget [] so it's only called on first render)
    useEffect(() => {
        const fetchAndProcessData = async () => {
            let div_id = ""
            let top_fifty = new Array(0)
            if (songs_bool) {
                div_id = "top_fifty_songs"

                const returned_data = await get_users_top_items("tracks", 50, "long_term", access_token)
                const songs = returned_data['items']
                const popularities = await get_songs_popularities(songs)
                top_fifty = Object.keys(popularities)

            }
            else {
                div_id = "top_fifty_artists"

                const returned_data = await get_users_top_items("artists", 50, "long_term", access_token)
                const artists = returned_data['items'] 
                const popularities = await get_artists_popularities(artists)
                top_fifty = Object.keys(popularities)

            }

            // set the state equal to the new data inside of this function
            setState({"top_fifty": top_fifty, "div_id": div_id, "ol_id": div_id + '_list'})
            setBusy(false)
        }

        fetchAndProcessData()
    }, [])

    // NOTE: if getting an error, I might need double curly brackets around the div id !!!!!
    if (isBusy) {
        return (
            <div id={state["div_id"]}>
                <h4>fetching data...</h4>
            </div>
        )
    }
    else {
        return (
            <div id={state["div_id"]}>
                <ol id={state["ol_id"]}>
                    {state["top_fifty"].map((name, i) => <li key={i+1}>{name}</li>)}
                </ol>
            </div>
        )
    }

}


// old code from index.js that I originally used to do this
// function generate_top_fifty_list(names) {
//     var names_div = document.getElementById("top_fifty")
//     names_div.innerHTML += '<ol id="top_fifty_list"></ol>'
//     var ol = document.getElementById("top_fifty_list")
//     names.forEach((name, i) => {
//       ol.innerHTML += `<li key=${i+1}>${name}</li>`
//     })
// }


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






export default TopFifty