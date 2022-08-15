import '../static/App.css';
import React from 'react';
import ExplicitPie from '../components/chartWrappers/ExplicitPie'
import ArtistAppsDonut from './chartWrappers/ArtistAppsDonut';

import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

function App(props) {
  let access_token = props["access_token"]

  return (
    <div id="app">
      <h5> react explicit pie for top fifty</h5>
      <ExplicitPie access_token={access_token} top_fifty={true}/>
      <h5> react explicit pie for all saved</h5>
      <ExplicitPie access_token={access_token} top_fifty={false}/>
      <h5>React artist appearences donut for top fifty</h5>
      <ArtistAppsDonut access_token={access_token} top_fifty={true}/>
      <h5>React artist appearences donut for all saved</h5>
      <ArtistAppsDonut access_token={access_token} top_fifty={false}/>
      <p> hi this is the main app component, in the future the charts will be child components of their chart wrappers which will be children of this App component </p>
    </div>
  );
}

export default App;

