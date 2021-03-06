// TODO: I am quite confident that there's a lot of junk / unused imports here
import L from 'leaflet';
global.shp=require('shpjs');
require('./ots/leaflet.shpfile.js');


import proj4 from 'proj4';

import chai from './util/chai-util.js';
const assert = chai.assert;


import { v4 as uuidv4 } from 'uuid';


import {DefaultIcon, TreeIcon}       from './icons.js';
import {CustomCircleMarker}          from './custom-markers.js';
import rainbow                       from './rainbow.js';
import {sca_fake_return
        , uniqValues, tnu}           from './util/util.js';
import {axiosAuth} from './axios-setup.js';
import {possiblyInsufPrivPanicInAnyCase} from './util-privilleges.js';

import {ATHENS} from './constants/map-constants.js';
import {addPopup} from './leaflet-util.js';

const myRenderer = L.canvas({ padding: 0.5 });

const defaultMarkerStyle = {radius: 8};

function extractLayerNames(configuration) {
    return uniqValues(Object.values(configuration).map(x=>x.layer));
}

function from_kind2layer_to_layer2kinds(configuration) {
    const rv = {};
    const layers = extractLayerNames(configuration);
    for (let kind in configuration) {
        const layer = configuration[kind].layer;
        let kinds = rv[layer];
        if (kinds===undefined) {
            rv[layer] = [];
            kinds = rv[layer];
        }
        kinds.push(parseInt(kind));
    }
    return rv;
}


const treeOverlays = (treeConfiguration, data)=> {
    console.log(treeConfiguration);
    console.log(data);
    assert.exists(treeConfiguration, `tree configuration is null or undefined (${tnu(treeConfiguration)})`);
    assert.exists(data, `tree data is null or undefined (${tnu(data)})`);
    const id2marker = {};
    const overlays = {};
    const overlayNames = extractLayerNames(treeConfiguration);
    console.log(overlayNames);
    const layer2kinds = from_kind2layer_to_layer2kinds(treeConfiguration);

    overlayNames.forEach( (overlayName) => {
        const layerGroup = L.layerGroup(data.filter(({kind})=>{
            const kindsInThisLayer = layer2kinds[overlayName];
            assert.isTrue(Array.isArray(kindsInThisLayer));
            const rv = kindsInThisLayer.includes(kind);
            return rv;
        }).map( ({id, kind, coords})=> {
            assert.isNotNull(id);
            const marker = new L.circleMarker([coords.latitude, coords.longitude]
                                              , {radius: 8
                                                 , color: treeConfiguration[kind].color
                                                 , renderer: myRenderer
                                                 , targetId: id
                                                 , kind});
            addPopup(marker, treeConfiguration[kind].name.singular);
            
            id2marker[id] = marker;
            return marker;

        })); // const layerGroup = L.layerGroup(...
        overlays[overlayName] = layerGroup;
    }); // overlayNames.forEach
    return {overlays, id2marker};
};



const ota_Callicrates = (()=>{
    const url = require('../data/oriadhmwnkallikraths.zip');
    const options = {
        onEachFeature: function(feature, layer) {
            if (feature.properties) {
                layer.bindPopup(Object.keys(feature.properties).map(function(k) {
                    return k + ": " + feature.properties[k];
                }).join("<br />"), {
                    maxHeight: 200
                });
            }
        }
        , style: (feature)=>{
            return  {color:"black"};
        }
    };
    return L.shapefile(url, options);
})();


function generateRandomCoordinatesInAthens(N) {
    const rv = [];
    const spanDegrees = 0.05;
    
    for (let i = 0; i < N; i++) {
        rv.push([ATHENS[0]+(Math.random()-.5)*spanDegrees
                 , ATHENS[1]+(Math.random()-.5)*spanDegrees]);
    }
    return rv;
}


export {ota_Callicrates, treeOverlays}
