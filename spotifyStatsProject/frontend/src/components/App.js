import '../static/App.css';

import React from 'react';

import ExplicitPie from './thirdLevel/chartWrappers/ExplicitPie'
import ArtistAppsDonut from './thirdLevel/chartWrappers/ArtistAppsDonut'
import FollowedBar from './thirdLevel/chartWrappers/FollowedBar'
import SongStatsRadar from './thirdLevel/chartWrappers/SongStatsRadar'
import PopBar from './thirdLevel/chartWrappers/PopBar';
import CommonGenresDonut from './thirdLevel/chartWrappers/CommonGenresDonut';
import TopFiftySongsList from './secondLevel/TopFiftySongsList';
import TopFiftyArtistsList from './secondLevel/TopFiftyArtistsList';

import TopFiftyArtistsData from './secondLevel/TopFiftyArtistsData';
import TopFiftySongsData from './secondLevel/TopFiftySongsData';
import SavedSongsData from './secondLevel/SavedSongsData';

import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

function App(props) {
  let access_token = props["access_token"]
  let root = props["root"]

  function render_top_artists_data() {
    root.render(
      <div id="app">
        <button id="top_songs" onClick={render_top_songs_data}>get data on top 50 songs</button>
        <button id="saved_tracks" onClick={render_saved_songs_data}>get data on your saved tracks (note: could take a little time if you have a lot)</button>
        <button id="top_fifty_songs_button" onClick={render_top_fifty_songs}>see top fifty songs</button>
        <button id="top_fifty_songs_artists" onClick={render_top_fifty_artists}>see top fifty artists</button>
        <TopFiftyArtistsData access_token={access_token}/>
      </div>
    )
  }

  function render_top_songs_data() {
    root.render(
    <div id="app">
      <button id="top_artists" onClick={render_top_artists_data}>get data on top 50 artists</button>
      <button id="saved_tracks" onClick={render_saved_songs_data}>get data on your saved tracks (note: could take a little time if you have a lot)</button>
      <button id="top_fifty_songs_button" onClick={render_top_fifty_songs}>see top fifty songs</button>
      <button id="top_fifty_songs_artists" onClick={render_top_fifty_artists}>see top fifty artists</button>
      <TopFiftySongsData access_token={access_token}/>
    </div>)
  }

  function render_saved_songs_data() {
    root.render(
      <div id="app">
        <button id="top_artists" onClick={render_top_artists_data}>get data on top 50 artists</button>
        <button id="top_songs" onClick={render_top_songs_data}>get data on top 50 songs</button>
        <button id="top_fifty_songs_button" onClick={render_top_fifty_songs}>see top fifty songs</button>
        <button id="top_fifty_songs_artists" onClick={render_top_fifty_artists}>see top fifty artists</button>
        <SavedSongsData access_token={access_token}/>
      </div>
    )
  }

  function render_top_fifty_songs() {
    root.render(
      <div id="app">
        <button id="top_artists" onClick={render_top_artists_data}>get data on top 50 artists</button>
        <button id="top_songs" onClick={render_top_songs_data}>get data on top 50 songs</button>
        <button id="saved_tracks" onClick={render_saved_songs_data}>get data on your saved tracks (note: could take a little time if you have a lot)</button>
        <button id="top_fifty_songs_artists" onClick={render_top_fifty_artists}>see top fifty artists</button>
        <TopFiftySongsList access_token={access_token}/>
      </div>
    )
  }

  function render_top_fifty_artists() {
    root.render(
      <div id="app">
        <button id="top_artists" onClick={render_top_artists_data}>get data on top 50 artists</button>
        <button id="top_songs" onClick={render_top_songs_data}>get data on top 50 songs</button>
        <button id="saved_tracks" onClick={render_saved_songs_data}>get data on your saved tracks (note: could take a little time if you have a lot)</button>
        <button id="top_fifty_songs_button" onClick={render_top_fifty_songs}>see top fifty songs</button>
        <TopFiftyArtistsList access_token={access_token} songs_bool={false}/>
      </div>
    )
  }


  return (
    <div id="app">
      <button id="top_artists" onClick={render_top_artists_data}>get data on top 50 artists</button>
      <button id="top_songs" onClick={render_top_songs_data}>get data on top 50 songs</button>
      <button id="saved_tracks" onClick={render_saved_songs_data}>get data on your saved tracks (note: could take a little time if you have a lot)</button>
      <button id="top_fifty_songs_button" onClick={render_top_fifty_songs}>see top fifty songs</button>
      <button id="top_fifty_songs_artists" onClick={render_top_fifty_artists}>see top fifty artists</button>
    </div>
  )
}

export default App;

