import {UPDATE_MOUSE_COORDS} from '../constants/action-types.js';
export default (state = null, action) => {
    switch (action.type) {
    case UPDATE_MOUSE_COORDS:
        return action.payload.latlng;
    default:
        return state;
    }
}
