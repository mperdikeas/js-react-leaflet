const     $ = require('jquery');
window.$ = $; // make jquery available to other scripts (not really applicable in our case) and the console
require('jquery-ui-bundle'); // https://stackoverflow.com/a/39230057/274677
import React    from 'react';
import ReactDOM from 'react-dom';
import App      from './app.jsx';


import 'reset-css';
import 'bootstrap/dist/css/bootstrap.min.css';

import 'antd/dist/antd.css';

// https://stackoverflow.com/a/53580347/274677
import '@fortawesome/fontawesome-free/js/fontawesome';
import '@fortawesome/fontawesome-free/js/solid';
import '@fortawesome/fontawesome-free/js/regular';
import '@fortawesome/fontawesome-free/js/brands';

import { BrowserRouter } from 'react-router-dom';

import './css/style.css';


import LoginContextProvider              from './context/login-context.jsx'
import GeometryContextProvider           from './context/geometry-context.jsx'

import { Provider }             from "react-redux";
import store                    from './redux/store/index.js';

import 'leaflet-draw';

import './hack-for-the-leaflet-wrong-image-url.js';
import './geojson-override.js';


$(document).ready(doStuff);

function doStuff() {
  doRender();
}

function doRender() {
  ReactDOM.render(
    <Provider store={store}>
      <LoginContextProvider>
        <GeometryContextProvider>
          <BrowserRouter>
            <App/>
          </BrowserRouter>
        </GeometryContextProvider>
      </LoginContextProvider>
    </Provider>
    , $('#app')[0]);
}




