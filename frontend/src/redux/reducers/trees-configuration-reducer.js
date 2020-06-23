import {UPDATE_TREES_CONFIGURATION} from '../actions/action-types.js';
export default (state = undefined, action) => {
    switch (action.type) {
    case UPDATE_TREES_CONFIGURATION:
        return action.payload;
    default:
        return state;
    }
}
