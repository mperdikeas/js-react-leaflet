require('./css/style.css');
const     _ = require('lodash');
const     $ = require('jquery');
window.$ = $; // make jquery available to other scripts (not really applicable in our case) and the console


const React = require('react');
var      cx = require('classnames');

import PropTypes from 'prop-types';

const createReactClass = require('create-react-class');
const assert = require('chai').assert;

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';


class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
        };
    }

    componentDidMount() {
        console.log('componentDidMount()');
        this.map = L.map('map-id', {
            center: Athens,
            zoom: 12,
            zoomControl: true
        });


        const layerToUse = 2;
        if (layerToUse===1) {
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
	        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012',
                detectRetina: true,
                maxZoom: 50
            }).addTo(this.map);
        } else if (layerToUse===2) {
            // provider: MapBox
            const mapboxAccessToken = "pk.eyJ1IjoibXBlcmRpa2VhcyIsImEiOiJjazZpMjZjMW4wOXJzM2ttc2hrcTJrNG9nIn0.naHhlYnc4czWUjX0-icY7Q";
            L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
                attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
                maxZoom: 25,
                id: 'mapbox/streets-v11',
                accessToken: mapboxAccessToken
            }).addTo(this.map);


            generateCoordinatesInAthens().forEach( c=> {
                if (true)
                L.circle(c, {
                    color: 'red',
                    fillColor: '#f03',
                    fillOpacity: 0.5,
                    radius: 1
                }).addTo(this.map);
                else
                L.marker(c).addTo(this.map).bindPopup('a marker').openPopup();
            });
        }


        

    }
    
    componentDidUpdate(prevProps, prevState) {
        console.log('componentDidUpdate()');
    }


    render() {
        console.log('render()');
        return (
                <div id='map-id' style={{width: "80%", height: "800px" }}>
                </div>
        );
    }
}

const Athens = [37.98, 23.72];

function generateCoordinatesInAthens() {
    const rv = [];
    const spanDegrees = 0.05;
    
    for (let i = 0; i < 1000; i++) {
        rv.push([Athens[0]+(Math.random()-.5)*spanDegrees
                 , Athens[1]+(Math.random()-.5)*spanDegrees]);
    }
    return rv;
}

export default App;

