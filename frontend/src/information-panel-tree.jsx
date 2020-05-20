const React = require('react');
var      cx = require('classnames');

const assert = require('chai').assert;

import { connect }          from 'react-redux';

import {axiosAuth} from './axios-setup.js';


import {CancelToken} from 'axios';

import {Nav} from 'react-bootstrap';

import L from 'leaflet';

require('./css/information-panel.css');
import TargetDataPane       from './target-data-pane.jsx';
import TargetPhotoPane      from './target-photo-pane.jsx';
import TargetMetadataPane   from './target-metadata-pane.jsx';
import TargetAdjustmentPane from './target-adjustment-pane.jsx';

import {displayModal
      , clearModal
      , toggleMaximizeInfoPanel
      , setPaneToOpenInfoPanel
      , setTreeInfo
      , setTreeInfoOriginal}  from './actions/index.js';
import {INFORMATION, PHOTOS, HISTORY, ADJUST} from './constants/information-panel-panes.js';
import {MDL_NOTIFICATION, MDL_NOTIFICATION_NO_DISMISS, MODAL_LOGIN} from './constants/modal-types.js';



import wrapContexts from './context/contexts-wrapper.jsx';

import {LOGGING_IN
      , LOADING_TREE_DATA
      , SAVING_TREE_DATA} from './constants/information-panel-tree-server-call-types.js';

import {OP_NO_LONGER_RELEVANT} from './constants/axios-constants.js';
import {msgTreeDataIsDirty, displayNotificationIfTargetIsDirty} from './common.jsx';
import {possiblyInsufPrivPanicInAnyCase, isInsufficientPrivilleges} from './util-privilleges.js';

import {GSN, globalGet} from './globalStore.js';

const mapStateToProps = (state) => {
  return {
    maximizedInfoPanel: state.maximizedInfoPanel
    , targetId: state.targetId
    , targetIsDirty: JSON.stringify(state.treeInfo.original)!==JSON.stringify(state.treeInfo.current)
    , tab: state.paneToOpenInfoPanel
    , treeInfo: state.treeInfo.current
  };
};

const mapDispatchToProps = (dispatch) => {
  return {dispatch};
}

// refid: SSE-1589888176
const mergeProps = ( stateProps, {dispatch}) => {
  const msgTreeDataHasBeenUpdated = targetId => `τα νέα δεδομένα για το δένδρο #${targetId} αποθηκεύτηκαν`;
  const msgSavingTreeData = targetId => `αποθήκευση δεδομένων για το δένδρο #${targetId}`;
  return {
    ...stateProps
    , displayModalLogin: (func)  => dispatch(displayModal(MODAL_LOGIN, {followUpFunction: func}))
    , displayNotificationInsufPrivilleges: ()=>dispatch(displayModal(MDL_NOTIFICATION, {html: msgInsufPriv1}))
    , displayTreeDataHasBeenUpdated: (targetId)=>dispatch(displayModal(MDL_NOTIFICATION, {html: msgTreeDataHasBeenUpdated(targetId)}))
    , displayModalSavingTreeData  : ()=>dispatch(displayModal(MDL_NOTIFICATION_NO_DISMISS, {html: msgSavingTreeData(stateProps.targetId)}))
    , clearModal : () => dispatch(clearModal())
    , toggleMaximizeInfoPanel: ()=>dispatch(toggleMaximizeInfoPanel())
    , setPaneToOpenInfoPanel: (pane) => dispatch(setPaneToOpenInfoPanel(pane))
    , displayNotificationTargetIsDirty  : ()=>dispatch(displayModal(MDL_NOTIFICATION, {html: msgTreeDataIsDirty(stateProps.targetId)}))
    , setTreeInfoOriginal: (treeInfo) => dispatch(setTreeInfoOriginal(treeInfo))
    , setTreeInfo        : (treeInfo) => dispatch(setTreeInfo        (treeInfo))
  };
}

class TreeInformationPanel extends React.Component {

  constructor(props) {
    super(props);
    this.state = this.getInitialState();
    this.source = CancelToken.source();
  }


  getInitialState = () => {
    return {
      serverCallInProgress: LOADING_TREE_DATA
//      , treeData: null
//      , treeDataOriginal: null
      , error: null
    };
  }

  displayNotificationIfTargetIsDirty = displayNotificationIfTargetIsDirty.bind(this);
  
  componentDidMount() {
    this.fetchData();
  }

  componentWillUnmount() {
    console.log('TreeInformationPanel: unmounting and cancelling requests...');
    this.source.cancel(OP_NO_LONGER_RELEVANT);
  }

  
  componentDidUpdate(prevProps, prevState) {
    if (prevProps.targetId !== this.props.targetId) {
      console.log('cancelling pending requests due to new target');
      this.source.cancel(OP_NO_LONGER_RELEVANT);
      this.source = CancelToken.source(); // cf. SSE-1589117399
      this.fetchData();
    }
  }


  
  
  updateTreeData = (treeInfo) => {
    this.props.setTreeInfo(treeInfo);
  }



  setTreeInfoOriginal = (treeInfo) => {
    this.props.setTreeInfoOriginal(treeInfo);
  }


  fetchData = () => {
    const url = `/feature/${this.props.targetId}/data`;
    console.log(`fetchData, axios URL is: ${url}`);
    this.setState({serverCallInProgress: LOADING_TREE_DATA});
    axiosAuth.get(url, {cancelToken: this.source.token}
    ).then(res => {
      // corr-id: SSE-1585746250
      console.log(res.data);
      const {t, err} = res.data;
      console.log(t);
      if (err===null) {
        console.log('error is null');
        this.props.setTreeInfoOriginal(t);
        this.setState({serverCallInProgress: null, error: null});
        // TODO: maybe the serverCallInProgress should also be part of the redux store
      } else {
        console.error('error is NOT null');

        //   , treeData: null
        // , treeDataOriginal: null

        this.props.setTreeInfoOriginal(null);
        this.setState({ serverCallInProgress: null
                      , error: {message: `server-side error: ${err.message}`
                              , details: err.strServerTrace}});
      }
    }).catch( err => {
      if (err.message === OP_NO_LONGER_RELEVANT) {
        console.log('fetchNumOfPhotos operation is no longer relevant and got cancelled');
      } else if (err.response && err.response.data) {
        // SSE-1585746388: the shape of err.response.data is (code, msg, details)
        // Java class ValidJWSAccessTokenFilter#AbortResponse
        const {code, msg, details} = err.response.data;
        switch(code) {
          case 'JWT-verif-failed':
            this.props.displayModalLogin( ()=>{this.setState({error: null}); this.fetchData();} );
            this.props.setTreeInfoOriginal(null);
            this.setState({serverCallInProgress: LOGGING_IN
//                         , treeData: null
  //                       , treeDataOriginal: null
                         , error: {message: `JWT verif. failed. Server message is: [${msg}] - waiting for user login`
                                 , details: details}});

            break;
          default:
            this.props.setTreeInfoOriginal(null);
            this.setState({serverCallInProgress: null
//                         , treeData: null
  //                       , treeDataOriginal: null
                         , error: {message: `unexpected error code: ${code}`
                                 , details: msg}});

        }
      } else {
        this.props.setTreeInfoOriginal(null);
        this.setState({serverCallInProgress: null
    //                 , treeData: null
      //               , treeDataOriginal: null
                     , error: {message: 'unexpected error - likely a bug'
                             , details: JSON.stringify(err)}});

      }
    }) // catch
  } // fetchData


  targetId2Marker = (targetId) => {
    return globalGet(GSN.REACT_MAP).id2marker[targetId];
  }
  
  handleSubmit = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    console.log('handle submit');
    console.log(this.props.treeInfo);
    console.log(JSON.stringify(this.props.treeInfo));    
    // the post cannot be cancelled so we don't bother with a cancel token
    this.setState({serverCallInProgress: SAVING_TREE_DATA});
    this.props.displayModalSavingTreeData();
    const self = this;
    axiosAuth.post(`/feature/${this.props.targetId}/data`, this.props.treeInfo).then(res => {
      console.log('in axios;:then');
      this.props.clearModal();
      this.setState({serverCallInProgress: null});
      if (res.data.err != null) {
        console.log(`/feature/${this.props.targetId}/data POST error`);
        assert.fail(res.data.err);
      } else {
        console.log('abc - API call success');
        const targetId = self.props.targetId;
        const markerInMainMap = self.targetId2Marker(targetId);
        const {latitude: lat, longitude: lng} = self.props.treeInfo.coords;
        markerInMainMap.setLatLng(L.latLng(lat, lng));
        console.log('abc - updated marker on main map');
        console.log(res.data.t);
        this.props.displayTreeDataHasBeenUpdated(this.props.targetId);
        // this.props.dataIsNowSaved();
        this.props.setTreeInfoOriginal(this.props.treeInfo);
      }
    }).catch( err => {
      console.log('in axios;:catch');
      this.props.clearModal();
      this.setState({serverCallInProgress: null});
      if (isInsufficientPrivilleges(err)) {
        console.log('insuf detected');
        this.props.displayNotificationInsufPrivilleges();
      } else {
        if (err.response && err.response.data) {
          // SSE-1585746388: the shape of err.response.data is (code, msg, details)
          // Java class ValidJWSAccessTokenFilter#AbortResponse
          const {code, msg, details} = err.response.data;
          switch(code) {
            case 'JWT-verif-failed':
              this.props.displayModalLogin( ()=>{this.setState({error: null}); this.handleSubmit();});
              break;
            default:
              assert.fail(`unexpected condition: code=${code}, msg=${msg}, details=${details}`);
          }
        } else {
          console.log(err);
          assert.fail(`unexpected condition: ${JSON.stringify(err)}`);
        }
      }
    });
  }


  onInformation = () => {
    if (!this.displayNotificationIfTargetIsDirty())
      this.props.setPaneToOpenInfoPanel(INFORMATION);
  }

  onPhotos = () => {
    if (!this.displayNotificationIfTargetIsDirty())
      this.props.setPaneToOpenInfoPanel(PHOTOS);
  }

  onHistory = () => {
    if (!this.displayNotificationIfTargetIsDirty())
      this.props.setPaneToOpenInfoPanel(HISTORY);
  }

  onAdjust = () => {
    if (!this.displayNotificationIfTargetIsDirty())
      this.props.setPaneToOpenInfoPanel(ADJUST);
  }
  
  

  render() {
    if (this.props.targetId===null) {
      return (
        <div id='detailInformation' className='col-4 padding-0' style={{backgroundColor: 'lightgrey'}}>
          click on a feature to see its information
        </div>
      );
    } else {
      console.log(`tab is  ${this.props.tab}, targetId is: ${this.props.targetId}`);
      const defaultClasses = {'nav-link': true};
      const informationClasses = Object.assign({}, defaultClasses, {'active': this.props.tab===INFORMATION});
      const photoClasses = Object.assign({}, defaultClasses, {'active': this.props.tab===PHOTOS});
      const historyClasses = Object.assign({}, defaultClasses, {'active': this.props.tab===HISTORY});
      const adjustClasses = Object.assign({}, defaultClasses, {'active': this.props.tab===ADJUST});      

      const paneToDisplay = this.paneToDisplay();
      const toggleTxt = this.props.maximizedInfoPanel?'Ελαχιστοποίηση':'Μεγιστοποίηση';
      const klasses = Object.assign({'padding-0': true}
                                  , {'col-4': !this.props.maximizedInfoPanel, 'col-12': this.props.maximizedInfoPanel});

      const tagReal = (<div className='col-6' style={{fontSize: '130%'}}>
          info on&nbsp;
          <span style={{fontFamily: 'monospace'}}>{this.props.targetId}</span>
      </div>);
      const tagDummy = (<div className='col-6' style={{fontSize: '130%'}}>
          Tag #
          <span style={{fontFamily: 'monospace'}}>198305193817</span>
      </div>);
      const heightStyle = {height: `${this.getInformationPanelHeight()}px`, overflow: 'scroll'};

      return (
        <div id='detail-information' className={cx(klasses)} style={Object.assign({}, heightStyle, {backgroundColor: 'lightgrey'})}>
          <div className='row' style={{marginLeft: 0, marginRight: 0}}>
            {tagReal}
            <div className='col-6'>
              <a id='toggle-info-panel' className={cx(defaultClasses)} href="#" onClick={this.props.toggleMaximizeInfoPanel}>{toggleTxt}</a>
            </div>
          </div>

        <Nav variant='pills' activeKey={this.props.tab} justify={true}
            onSelect={(selectedKey) => {
                     switch (selectedKey) {
                       case INFORMATION:
                         this.onInformation();
                         break;
                       case PHOTOS:
                         this.onPhotos();
                         break;
                       case HISTORY:
                         this.onHistory();
                         break;
                       case ADJUST:
                         this.onAdjust();
                         break;
                       default:
                         throw `unhandled key: ${selectedKey}`;
                     }
                     }
                     }
        >
        <Nav.Item>
          <Nav.Link eventKey={INFORMATION}>Γενικά</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey={PHOTOS}>Φωτό</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey={HISTORY}>Ιστορικό</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey={ADJUST}>Μετατόπιση</Nav.Link>
        </Nav.Item>
        </Nav>
          
          {paneToDisplay}
        </div>
      );
    }
  }

  getInformationPanelHeight = () => {
    return this.props.geometryContext.screen.height - this.props.geometryContext.geometry.headerBarHeight
  }

  paneToDisplay = () => {
    console.log(`displaying pane ${this.props.tab}`);
    if (this.state.error)
      return (
        <>
        <div>Σφάλμα</div>
        <div style={{color: 'red'}}>{JSON.stringify(this.state.error)}</div>
        </>
      );
    else if (this.state.serverCallInProgress === LOGGING_IN) {
      return <div>user is logging in &hellip;</div>;
    }
    else if (this.state.serverCallInProgress  === LOADING_TREE_DATA) {
      return <div>querying the server for tree {this.props.targetId} &hellip;</div>;
    }
    else {
      switch (this.props.tab) {
        case INFORMATION:
          return (
            <TargetDataPane
                updateTreeData      = {this.updateTreeData}
                setTreeInfoOriginal = {this.setTreeInfoOriginal}
                handleSubmit        = {this.handleSubmit}
                savingTreeData      = {this.state.serverCallInProgress === SAVING_TREE_DATA}
            />
          );
        case PHOTOS:
          return <TargetPhotoPane/>
        case HISTORY:
          return (
            <TargetMetadataPane/>
          );
        case ADJUST: {
          return <TargetAdjustmentPane
                     handleSubmit        = {this.handleSubmit}
                     savingTreeData      = {this.state.serverCallInProgress === SAVING_TREE_DATA}
                 />;
        }
        default:
          assert.fail(`unhandled case [${this.props.tab}]`);
          return null; // SCA
      }
    }
  }
}



export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(wrapContexts(TreeInformationPanel));

