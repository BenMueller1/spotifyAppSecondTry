import React from 'react';
import ReactDOM from 'react-dom/client';
import './static/index.css';
import App from './components/App';

import "bootstrap/dist/css/bootstrap.min.css";


const API_URL = "https://localhost:8000/api"  // this is the link to my api, update as needed (will need to update if I publish)

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);