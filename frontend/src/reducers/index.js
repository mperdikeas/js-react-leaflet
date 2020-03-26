import {CHANGE_TILE_PROVIDER
        , UPDATE_MOUSE_COORDS
        , SET_FLAG
        , CLEAR_FLAG
        , DISPLAY_MODAL
        , CLEAR_MODAL
        , TOGGLE_MAXIMIZE_INFO_PANEL
        , UPDATE_TARGET} from '../constants/action-types.js';

const assert = require('chai').assert;
import mouseCoordsReducer             from './mouseCoordsReducer.js';
import toggleTargetReducer            from './toggleTargetReducer.js';
import flagsReducer                   from './flagsReducer.js';
import modalReducer                   from './modalReducer.js';
import maximizedInfoPanelReducer      from './maximizedInfoPanelReducer.js';


function rootReducer(state = {}, action) {
    const rv = {
        latlng               : mouseCoordsReducer       (state.latlng, action),
        targetId             : toggleTargetReducer      (state.targetId, action),
        flags                : flagsReducer             (state.flags, action),
        modal                : modalReducer             (state.modal, action),
        maximizedInfoPanel   : maximizedInfoPanelReducer(state.maximizedInfoPanel, action)
    };
    return rv;
};


export default rootReducer;
