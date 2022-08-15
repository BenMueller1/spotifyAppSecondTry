// CHANGE BOILERPLATE from explicitpie to correct component


import React from 'react';
import { Pie } from "react-chartjs-2"
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

// access_token should be passed in by App as a prop
function ExplicitPie(access_token) {
    // initialize state as empty

    // use effect hook to call functions to get and generate data (don't forget [] so it's only called on first render)

    // don't forget to create options object if needed (could make a generate function if I want)

    // now pass the data and the options to the correct react-chartjs-2 component 
    return (
        <div id="ExplicitPie">
            <Pie data={{}} options={{}}/>
        </div>
    )
}


export default ExplicitPie