const React = require('react');
var      cx = require('classnames');

const assert = require('chai').assert;
import {Form, Col, Row, Button, Nav, ButtonGroup} from 'react-bootstrap';

// REDUX
import { connect }          from 'react-redux';

import {axiosAuth} from './axios-setup.js';

import L from 'leaflet';
import {Athens} from './tree-markers.js';

import {possiblyInsufPrivPanicInAnyCase, isInsufficientPrivilleges} from './util-privilleges.js';

import {MODAL_LOGIN, MDL_NOTIFICATION} from './constants/modal-types.js';
import {displayModal} from './actions/index.js';

import wrapContexts from './context/contexts-wrapper.jsx';

import {ATHENS, DEFAULT_ZOOM} from './constants/map-constants.js';

import {GSN, globalGet} from './globalStore.js';

const mapStateToProps = (state) => {
  return {
    targetId: state.targetId
  };
};

const mapDispatchToProps = (dispatch) => {
  const msgInsufPriv1 = 'ο χρήστης δεν έχει τα προνόμια για να εκτελέσει αυτήν την λειτουργία';
  const msgTreeDataHasBeenUpdated = targetId => `τα νέα δεδομένα για το δένδρο #${targetId} αποθηκεύτηκαν`;
  return {
    displayModalLogin: (func)  => dispatch(displayModal(MODAL_LOGIN, {followUpFunction: func}))
    , displayNotificationInsufPrivilleges: ()=>dispatch(displayModal(MDL_NOTIFICATION, {html: msgInsufPriv1}))
    , displayTreeDataHasBeenUpdated: (targetId)=>dispatch(displayModal(MDL_NOTIFICATION, {html: msgTreeDataHasBeenUpdated(targetId)}))
  };
}






class TargetAdjustmentPane extends React.Component {

  constructor(props) {
    super(props);
    this.state = {savingTreeData: false};
  }

  componentDidMount = () => {
    const targetId = this.props.targetId;
    console.log(targetId);
    const markerInMainMap = this.targetId2Marker(targetId);
    this.map = L.map('target-adjustment-map', {
      center: markerInMainMap.getLatLng(),
      zoom: DEFAULT_ZOOM+3,
      zoomControl: false
    });

    const baseLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      detectRetina: true,
      maxZoom: 50
    });
    baseLayer.addTo(this.map);
    this.addMarkers();
  }


  clearMarkers = () => {
    this.map.eachLayer( (layer) => {
      if ((layer instanceof L.Marker) || (layer instanceof L.CircleMarker))
        this.map.removeLayer(layer);
    });
  }

  addMarkers = () => {
    this.clearMarkers();
    const markerInMainMap = this.targetId2Marker(this.props.targetId);
    const marker = new L.marker(markerInMainMap.getLatLng()
                              , {radius: 8
                               , title: markerInMainMap.kind
                               , autoPan: false // only small size adjustments are foreseen
                               , draggable: 'true'});
    this.map.addLayer(marker)

    const origMapReactComponent = globalGet(GSN.REACT_MAP);
    const originalMap = origMapReactComponent.map;

    const latLngs = origMapReactComponent.getLatLngOfMarkersInBounds(this.map.getBounds()
                                                                   , this.props.targetId);
    latLngs.forEach((latlng) => {
      const marker = new L.circleMarker(latlng, {radius: 8});
      this.map.addLayer(marker)
    });

  }

  targetId2Marker = (targetId) => {
    return globalGet(GSN.REACT_MAP).id2marker[targetId];
  }

  componentDidUpdate = (prevProps, prevState) => {
    console.log(`target id is: ${this.props.targetId}`);
    if (prevProps.targetId !== this.props.targetId) {
      /*
      console.log('cancelling pending requests due to new target');
      this.source.cancel(OP_NO_LONGER_RELEVANT);
      this.source = CancelToken.source(); // cf. SSE-1589117399
      this.fetchData();
       */
      const targetId = this.props.targetId;
      const markerInMainMap = this.targetId2Marker(targetId);
      this.map.panTo(markerInMainMap.getLatLng(), {animate: true, duration: 5} );
      this.map.on('moveend', () => {
        console.log('pan ended');
        this.addMarkers();
      });
    }
  }
  

  render() {
    return (
      <div id='target-adjustment-map' style={{height: '350px'}}>
      </div>
    );
  }
}


export default connect(mapStateToProps, mapDispatchToProps)(wrapContexts(TargetAdjustmentPane));


