import {GET_REGIONS_IN_PROGRESS
        , GET_REGIONS_SUCCESS}  from '../actions/action-types.js';

import chai from '../../util/chai-util.js';
const assert = chai.assert;


export default (state = undefined, action) => {
    switch (action.type) {
    case GET_REGIONS_IN_PROGRESS: {
        return undefined;
    }
    case GET_REGIONS_SUCCESS: {
        return action.payload;
    }
    default:
        return state;
    }
}

