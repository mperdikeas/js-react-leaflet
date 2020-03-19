const     _ = require('lodash');
const     $ = require('jquery');
window.$ = $; // make jquery available to other scripts (not really applicable in our case) and the console


const React = require('react');
var      cx = require('classnames');

const assert = require('chai').assert;

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import {BaseLayers, BaseLayersForLayerControl} from './baseLayers.js';
export default function TilesSelector(props) {
  const options = [];
  for (let x in BaseLayers) {
    options.push(
      <a key={x} className="dropdown-item" onClick={()=>props.onTileProviderSelect(x)}>
        {BaseLayers[x].friendlyName}
      </a>
    );
  }
  const dropDownMenu = (
    <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
      {options}
    </div>
  );
  return (
    <>
    <button className="btn btn-primary dropdown-toggle"
            type="button" id="dropdownMenuButton"
            data-toggle="dropdown"
            aria-haspopup="true"
            aria-expanded="false">
      Υπόβαθρο
    </button>
    {dropDownMenu}    
    </>
  );
}
