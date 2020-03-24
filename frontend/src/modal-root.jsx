const     _ = require('lodash');
const     $ = require('jquery');
window.$ = $; // make jquery available to other scripts (not really applicable in our case) and the console


const React = require('react');
var      cx = require('classnames');

const assert = require('chai').assert;
import axios from 'axios';
import {setCookie}                             from './util.js';

import {GeometryContext} from './context/geometry-context.jsx';

import TilesSelector                           from './tiles-selector.jsx';
import Map                                     from './map.jsx';
import TreeInformationPanel                    from './information-panel-tree.jsx';
import InformationPanelGeometryDefinition      from './information-panel-geometry-definition.jsx';
import PointCoordinates                        from './point-coordinates.jsx';
import Toolbox                                 from './toolbox.jsx';
import {SELECT_TREE_TOOL, DEFINE_POLYGON_TOOL} from './map-tools.js';
import {BASE_URL}                              from './constants.js';

import './css/modal-dialog.css'; // TODO: use React emotion for element-scoped CSS

import wrapContexts from './context/contexts-wrapper.jsx';

import ModalLogin               from './modal-login.jsx';
import ModalAddGeometry         from './modal-add-geometry.jsx';
import ModalSaveWorkspaceToDisk from './modal-save-workspace-to-disk.jsx';

import {MODAL_LOGIN, MODAL_ADD_GEOMETRY, MDL_SAVE_WS_2_DSK} from './constants/modal-types.js';

const MODAL_COMPONENTS = {
  MODAL_LOGIN: ModalLogin,
  MODAL_ADD_GEOMETRY: ModalAddGeometry,
  MDL_SAVE_WS_2_DSK: ModalSaveWorkspaceToDisk
};



// redux
import {  connect   }              from 'react-redux';
import { clearModal, addGeometry } from './actions/index.js';

const mapStateToProps = (state) => {
  return state.modal;
};


const ModalRoot = ({modal, children}) => {
  if (modal === null) {
    console.log('modal root is cleared !!');
    return (<>
      {children}
      </>
    )
  } else {
    const {modalType, modalProps} = modal;
    const SpecificModal = MODAL_COMPONENTS[modalType]
    console.log(`rendering modal for ${modalType}`);
    return (
      <>
          <SpecificModal {...modalProps}>
          </SpecificModal>
          {children}
      </>
    );
  }

}

export default connect(mapStateToProps, null)(wrapContexts(ModalRoot));


