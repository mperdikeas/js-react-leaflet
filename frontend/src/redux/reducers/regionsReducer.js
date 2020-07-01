import {GET_REGIONS_IN_PROGRESS
        , GET_REGIONS_SUCCESS
        , UPDATE_SELECTED_REGIONS}  from '../actions/action-type-keys.ts';

import chai from '../../util/chai-util.js';
const assert = chai.assert;


import existingRegionsReducer    from './existingRegionsReducer.js';
import editingRegionsReducer     from './editing-regions-reducer.ts';
import overlappingRegionsReducer from './overlappingRegionsReducer.js';

export default (state = {}, action) => {
    return {
        existing: existingRegionsReducer(state.existing, action)
        , editing: editingRegionsReducer(state.editing, action)
        , overlaps: overlappingRegionsReducer(state.overlaps, action)
    };
}

