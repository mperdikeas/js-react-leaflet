require('./ots/leaflet-heat.js');

require('@ansur/leaflet-pulse-icon/dist/L.Icon.Pulse.css');
require('@ansur/leaflet-pulse-icon/dist/L.Icon.Pulse.js');



window.shp=require('shpjs');
require('./ots/leaflet.shpfile.js');


const React = require('react');
var      cx = require('classnames');

import chai from './util/chai-util.js';
const assert = chai.assert;




import L from 'leaflet';
import 'leaflet/dist/leaflet.css';


import './ots/wise-leaflet-pip.js';

import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
//import '../node_modules/leaflet-draw/dist/leaflet.draw.js';

import proj4 from 'proj4';

import keycode from 'keycode';

import { v4 as uuidv4 } from 'uuid';

require('../node_modules/leaflet.markercluster/dist/MarkerCluster.Default.css');
require('../node_modules/leaflet.markercluster/dist/leaflet.markercluster.js');

import {exactlyOne, allStrictEqual} from './util/util.js';
import {BaseLayersForLayerControl} from './baseLayers.js';
import {DefaultIcon, TreeIcon}          from './icons.js';

import wrapContexts from './context/contexts-wrapper.jsx';

import {layerIsEmpty, numOfLayersInLayerGroup} from './leaflet-util.js';

// const Buffer = require('buffer').Buffer;
// const Iconv  = require('iconv').Iconv;

import {GSN, globalSet} from './globalStore.js';

import '../node_modules/leaflet-measure/dist/leaflet-measure.en.js';
import '../node_modules/leaflet-measure/dist/leaflet-measure.css';

import {axiosAuth} from './axios-setup.js';

import {ota_Callicrates, treeOverlays} from './tree-markers.js';

import {ATHENS, DEFAULT_ZOOM} from './constants/map-constants.js';
import {ABOMINATION_CNFG_NOT_AVAILABLE} from './constants/msg-constants.js';

import {MDL_NOTIFICATION, MDL_NOTIFICATION_NO_DISMISS} from './constants/modal-types.js';



import { connect }          from 'react-redux';
import {updateMouseCoords
      , displayModal
      , unsetOrFetch
      , clearModal
      , getConfigurationAndTreesAndThen}  from './redux/actions/index.js';


import TreeCountStatistic from './tree-count-statistic.js';

import {msgTreeDataIsDirty, displayNotificationIfTargetIsDirty} from './common.jsx';

import {targetIsDirty} from './redux/selectors.js';

const mapStateToProps = (state) => {
  if ((state.target.treeInfo != null) && (state.target.treeInfo.original != null)) {
    assert.isOk(state.target.treeInfo.current);
  }

  return {
    treesConfiguration: state.configuration?.species??undefined
    , trees: state.trees
    , treesOrConfShouldBeFetched: ( (state.configuration?.species??undefined) === undefined) || (state.trees === undefined)
    , targetIsDirty: targetIsDirty(state)
  };
};

const mapDispatchToProps = (dispatch) => {
  return {dispatch};
}

/*
 * SSE-1589888176
 * idiom for [mapDispatchToProps] and [mergeProps] described in:
 *     https://github.com/reduxjs/react-redux/issues/237#issuecomment-168816713
 *
 */
const mergeProps = (stateProps, {dispatch}) => {
  const pleaseWaitWhileAppIsLoading = <span>please wait while drawing map data &hellip; </span>;
  return Object.assign({},
                       {
                         ...stateProps
                         , pleaseWaitWhileAppIsLoading: (uuid)=>dispatch(displayModal(MDL_NOTIFICATION_NO_DISMISS, {html: pleaseWaitWhileAppIsLoading, uuid}))
                         , clearModal: (uuid)=> dispatch(clearModal(uuid))
                         , updateCoordinates                 : (latlng)   => dispatch(updateMouseCoords(latlng))
                         , unsetOrFetch : (targetId) => dispatch(unsetOrFetch(targetId))
                         , displayNotificationTargetIsDirty  : ()=>dispatch(displayModal(MDL_NOTIFICATION, {html: msgTreeDataIsDirty(stateProps.targetId), uuid: uuidv4()}))
                         , addTrees: (self)=> dispatch(getConfigurationAndTreesAndThen(()=>addTrees(self)))
                         });
}



const addTrees = (self) => {
  const {overlays, id2marker} = treeOverlays(self.props.treesConfiguration, self.props.trees);
  self.id2marker = id2marker;
  for (const layerName in overlays) {
    const layerGroup = overlays[layerName];
    layerGroup.addTo(self.map);
    self.clickableLayers.push(layerGroup);
    self.addClickListenersToMarkersOnLayer(layerGroup);
    self.layersControl.addOverlay(layerGroup, layerName);
  }      
}


// https://spatialreference.org/ref/epsg/2100/
proj4.defs([
  [
    'EPSG:2100',
    '+proj=tmerc +lat_0=0 +lon_0=24 +k=0.9996 +x_0=500000 +y_0=0 +ellps=GRS80 +towgs84=-199.87,74.79,246.62,0,0,0,0 +units=m +no_defs']
]);
const WGS84  = 'EPSG:4326';
const HGRS87 = 'EPSG:2100';

class Map extends React.Component {

  constructor(props) {
    super(props);
    this.layerGroup = null;
    this.clickableLayers = [];
    this.highlightedMarker = null;
    this.queryLayer = null;
    globalSet(GSN.REACT_MAP, this);
  }

  displayNotificationIfTargetIsDirty = displayNotificationIfTargetIsDirty.bind(this);
  
  getMapHeight = () => {
    return this.props.geometryContext.screen.height - this.props.geometryContext.geometry.headerBarHeight
  }

  getCurrentTileLayer = () => {
    const layers = [];
    this.map.eachLayer(function(layer) {
      if( layer instanceof L.TileLayer )
        layers.push(layer);
    });
    assert.isAtMost(layers.length, 1, `this code was written assumming that at most 1 tile layers are present, yet ${layers.length} were found`);
    if (layers.length===1)
      return layers[0];
    else
      return null;
  }

  handleClick = (e) => {
    this.props.updateCoordinates(e.latlng);
    return true;
  }


  componentWillUnmount = () => {
    window.removeEventListener ('resize', this.handleResize);
    this.map.off('click');
    this.map.remove();
  }


  installNewDrawWorkspace = (featureGroup) => {
    if (this.drawnItems!==undefined) {
      assert.isNotNull(this.drawnItems);
      this.drawnItems.clearLayers();
      this.layersControl.removeLayer(this.drawnItems);
      this.map.removeLayer(this.drawnItems);
      this.map.removeControl(this.drawControl);
    }
    
    this.drawnItems = featureGroup;
    this.layersControl.addOverlay(this.drawnItems, 'επιφάνεια εργασίας');      
    this.map.addLayer(this.drawnItems);
    this.drawControl = new L.Control.Draw({
      draw: {
        polyline: true,
        circlemarker: false, // GeoJSON does not support circles
        circle: false,       // --------------------------------
        rectangle: true,
        marker: true,
        polygon: {
          shapeOptions: {
            color: 'purple'
          },
          allowIntersection: false,
          drawError: {
            color: 'orange',
            timeout: 1000
          },
          showArea: true,
          metric: true
        }
      },
      edit: {
        featureGroup: this.drawnItems
      }
    });
    this.map.addControl(this.drawControl);
  }

  installNewQueryLayer = (featureGroup) => {
//    let queryLayer = globalGet(GSN.LEAFLET_QUERY_LAYER, false);
    if (this.queryLayer!==null) {
      this.queryLayer.clearLayers();
      this.layersControl.removeLayer(this.queryLayer);
      this.map.removeLayer(this.queryLayer);
    }
    this.queryLayer = featureGroup;
    this.layersControl.addOverlay(this.queryLayer, 'query results');
    this.map.addLayer(this.queryLayer);
  }  

  countTreesInLayer = (layer) => {
    const rv = new TreeCountStatistic();
    this.clickableLayers.forEach( (markers) => {
      markers.eachLayer ( (marker)=>{
        if (layer instanceof L.Polygon) {
          if (layer.contains(marker.getLatLng())) {
            rv.increment(marker.options.kind);
          }
        }
      });
    });
    return rv;
  }
  

  countTreesInDrawWorkspace = () => {
    let count = 0;
    this.drawnItems.eachLayer( (layer) => {
      count += this.countTreesInLayer(layer).total();
    });
    return count;
  }


  attachStatsPopupOnLayer  = (layer) => {
    if (layer instanceof L.Polygon) {
      console.log(`area is ${L.GeometryUtil.geodesicArea(layer.getLatLngs())}`);
      const countResult = this.countTreesInLayer(layer);
      assert.exists(this.props.treesConfiguration, ABOMINATION_CNFG_NOT_AVAILABLE);
      const detailBreakdown = countResult.toDetailBreakdownString(this.props.treesConfiguration);
      layer.bindPopup(`<b>${countResult.total()}</b><br>${detailBreakdown}`).openPopup();
    }
  }
  
  componentDidMount = () => {
    const uuid = uuidv4();

    this.props.pleaseWaitWhileAppIsLoading(uuid);

    window.addEventListener    ('resize', this.handleResize);
    this.map = L.map('map-id', {
      center: ATHENS,
      zoom: DEFAULT_ZOOM,
      zoomControl: false
    });

    this.map.doubleClickZoom.disable();

    const options = {position: 'topleft'
                   , primaryLengthUnit: 'meters'
                   , secondaryLengthUnit: 'kilometers'
                   , primaryAreaUnit: 'sqmeters'
                   , secondaryAreaUnit: 'hectares'
                  ,  decPoint: ','
                   , thousandsSep: '.'
                   , activeColor: '#A1EB0E'
                   , completedColor: '#DEAE09'};
    const measureControl = new L.Control.Measure(options);
    measureControl.addTo(this.map);


    this.addLayerGroupsExceptPromisingLayers();
    if (this.props.treesOrConfShouldBeFetched)
      this.props.addTrees(this);
    else
      addTrees(this);
    
    this.installNewDrawWorkspace(new L.FeatureGroup());

    this.map.on('draw:created', (e) => {
      const type = e.layerType,
            layer = e.layer;
      this.drawnItems.addLayer(layer);
      console.log(this.drawnItems.toGeoJSON(7));
      this.attachStatsPopupOnLayer(layer);
    });


    this.map.on(L.Draw.Event.EDITED, (e)=>{
      const {type: evType, layers} = e;
      assert.strictEqual(evType, L.Draw.Event.EDITED);
      layers.eachLayer( (layer)=> this.attachStatsPopupOnLayer(layer) );
    });

    
    const eventsToTriggerCounting = [L.Draw.Event.CREATED, L.Draw.Event.EDITED];
    eventsToTriggerCounting.forEach( (v) => {
      this.map.on(v, ()=>{console.log(`${this.countTreesInDrawWorkspace()} trees found in draw layers`);});
    });

    

    this.map.on('mousemove', (e) => this.props.updateCoordinates(e.latlng));

    this.map.on('click', this.handleClick);

    $('div.leaflet-control-container section.leaflet-control-layers-list div.leaflet-control-layers-overlays input.leaflet-control-layers-selector[type="checkbox"]').on('change', (e)=>{
    });
    setTimeout(()=>{this.props.clearModal(uuid)}, 1000); // I don't have a way to recognize when Leaflet is done painting all markers
}


  addLayerGroupsExceptPromisingLayers = () => {
    const overlays = {};
    overlays['Καλλικράτης'] = ota_Callicrates;
    this.layersControl = L.control.layers(BaseLayersForLayerControl, overlays).addTo(this.map);
    BaseLayersForLayerControl.ESRI.addTo(this.map);
  }



  getMarker = (id) => {
    return this.id2marker[id];
  }

  componentDidUpdate(prevProps, prevState) {
    if ((prevProps.loginContext.username===null) && (this.props.loginContext.username!==null)) {
//      this.addTrees();
    }
  }

  insertGeoJSONIntoWorkspace = (geoJSON) => {
    const options = {pointToLayer: (geoJsonPoint, latlng) => {
      if (geoJsonPoint.properties.hasOwnProperty("targetId")) {
        const marker =  L.circleMarker(latlng, {targetId: geoJsonPoint.properties.targetId});
        marker.on('click', this.clickOnCircleMarker);
        marker.options.interactive = true;
        return marker;
      } else {
        return L.marker(latlng);
      }
    }};
    const [circleMarkersFG, restFG] = splitFeatureGroupIntoCircleMarkersAndTheRest(L.geoJSON(geoJSON, options));
    this.installNewDrawWorkspace(restFG);
    if (! layerIsEmpty(circleMarkersFG))
      this.installNewQueryLayer(circleMarkersFG);
  }



  addClickListenersToMarkers = () => {
    this.clickableLayers.forEach( (layer) => {
      this.addClickListenersToMarkersOnLayer(layer);
    });
  }

  addClickListenersToMarkersOnLayer = (layer) => {
    layer.eachLayer ( (marker)=>{
      marker.on('click', this.clickOnCircleMarker);
      marker.options.interactive = true; // https://stackoverflow.com/a/60642381/274677
    }); // eachLayer
  }
  
  removeClickListenersFromMarkers = () => {
    this.clickableLayers.forEach( (markers) => {    
      markers.eachLayer ( (marker)=>{
        marker.off('click');
        marker.options.interactive = false; // https://stackoverflow.com/a/60642381/274677
      } ); // eachLayer
    }); // forEach
  }
  

  render() {
    const style = {height: `${this.getMapHeight()}px`};
    return (
      <div id='map-id' style={style}>
      </div>
    );
  }


  clickOnCircleMarker = (e) => {

    function createFuncToPulsateMarker (marker) {
      let i = 0;
      return ()=>{
        const weights = [1,2,3,4,5,4,3,2,1,0,0];
        i++;
        marker.setStyle({weight: weights[i % weights.length]});
      }
    }

    /*
     * returns the target id of the currently highlighted marker or null
     * if no highlighting marker is currently installed 
     */
    const clearCurrentHighlightedMarker = () => {
      if (this.highlightedMarker) {
        assert.isNotNull(this.highlightedMarker.interval);
        assert.isNotNull(this.highlightedMarker.targetId);
        const rv = this.highlightedMarker.targetId;
        console.log('clearing interval for pulsating marker');
        clearInterval(this.highlightedMarker.interval);
        this.highlightedMarker.marker.removeFrom(this.map);
        this.highlightedMarker = null;
        return rv;
      } else {
        return null;
      }
    }

    if (!this.displayNotificationIfTargetIsDirty()) {
      const oldTargetId = clearCurrentHighlightedMarker();
      const installNewHighlightingMarker = (coords, targetId) => {
        const options = {radius: 20, color: 'red', weight: 5, interactive: false};
        const marker = L.circleMarker(coords, options);
        this.highlightedMarker = {marker, targetId};
        this.highlightedMarker.marker.addTo(this.map);
        this.highlightedMarker.marker.bringToBack();


        const interval = setInterval(createFuncToPulsateMarker(marker), 50);
        this.highlightedMarker.interval = interval;
        this.map.setView(coords, this.map.getZoom());
      };
      const targetId = e.target.options.targetId;
      const coords = e.target.getLatLng();

      if (oldTargetId != targetId)
        installNewHighlightingMarker(coords, targetId);
      this.props.unsetOrFetch(e.target.options.targetId);
    }
  }

  adjustHighlightingMarker = (latlng) => {
    this.highlightedMarker.marker.setLatLng(latlng);
  }
  


  getInfoOfMarkersInBounds = (bounds, exceptId) => {
    assert.isOk(bounds);
    const rv = []
    let encounteredExceptedMarker = false;
    let n = 0;
    this.clickableLayers.forEach( (markers) => {
      markers.eachLayer ( (marker)=>{
        if (marker instanceof L.CircleMarker && bounds.contains(marker.getLatLng())) {
          n ++;
          if (marker.options.targetId === exceptId)
            encounteredExceptedMarker = true;
          else {
            rv.push({latlng: marker.getLatLng(), kind: marker.options.kind});
          }
        }
      });
    });
    assert.isTrue((exceptId === undefined) || encounteredExceptedMarker);
    return rv;
  }
}

function splitFeatureGroupIntoCircleMarkersAndTheRest(featureGroup) {
  const circleMarkerLayers = [];
  const restLayers = [];
  featureGroup.eachLayer( (layer) => {
    if (layer instanceof L.CircleMarker)
      circleMarkerLayers.push(layer);
    else
      restLayers.push(layer);
  });
  return [L.featureGroup(circleMarkerLayers)
        , L.featureGroup(restLayers)];
}

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(wrapContexts(Map));

