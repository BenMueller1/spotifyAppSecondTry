import { PolarArea } from "react-chartjs-2"
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

function PolarAreaChart(stuff) {
    return (
        <div>
            <p> chart will go here </p>
            <PolarArea data={stuff}/>
        </div>
    )
}

export default PolarAreaChart