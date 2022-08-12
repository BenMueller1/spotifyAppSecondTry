import '../static/App.css';
import React from 'react';
import { PolarArea } from 'react-chartjs-2';

import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

function App() {
  return (
    <div id="app">
      <p> hi this is the main app component, in the future the charts will be child components of their chart wrappers which will be children of this App component </p>
    </div>
  );
}

export default App;

