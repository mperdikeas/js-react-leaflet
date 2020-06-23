import {UPDATE_TREES} from '../actions/action-types.js';
export default (state = undefined, action) => {
    switch (action.type) {
    case UPDATE_TREES:
        return action.payload;
    default:
        return state;
    }
}
