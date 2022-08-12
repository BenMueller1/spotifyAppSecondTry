import '../static/App.css';
import React from 'react';
import { PolarArea } from 'react-chartjs-2';

import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

function App() {
  return (
    <div id="app">
      <p> most common genres among your top 50 artists of all time: </p>
    </div>
  );
}

export default App;

