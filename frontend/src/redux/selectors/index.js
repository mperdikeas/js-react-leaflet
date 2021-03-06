import chai from '../../util/chai-util.js';
const assert = require('chai').assert;

import {arr2str, reduxRegionsToAntdData} from './selector-util.js';



export function selectedRegions(state) {
    if (isRegionsBeingFetched(state))
        return [];

    const existingRegions = state.regions.existing;
    const selected = state.regions.editing.selected;
    assert.isOk(existingRegions);
    assert.isOk(selected);

    function str2arr(s) {
        const rv = s.split('-').map( x=>parseInt(x) );
        return rv;
    }

    function embellish(i, polygonsInPartition) {
        const rv = [];
        let j = 0;
        for (const [key, value] of Object.entries(polygonsInPartition)) {
            const x = Object.assign({}, {name: key, wkt: value.wkt}, {key: arr2str([i, j])});
            console.log('zzz', x);
            console.log(`zzz pushing object: ${JSON.stringify(x)}`);
            rv.push(x);
            j++;
        }
        if (false)
        for (let j = 0; j < polygonsInPartition.length ; j++) {
            rv.push(Object.assign({}, polygonsInPartition[j], {key: arr2str([i, j])}));
        }
        return rv;
    }


    let rv = [];
    selected.forEach( strKey => {
        const arr = str2arr(strKey);
        assert.isTrue((arr.length===1) || (arr.length===2)
                      , `selectors/index.js :: arr ${arr} had length ${arr.length}`);
        switch (arr.length) {
        case 1: {
            const key = Object.keys(existingRegions)[arr[0]]; //fetched the key at index arr[0]
            console.log(`case 1 partition name is ${key}`);
            rv = rv.concat(embellish(arr[0], existingRegions[key]));  // fetching all the polygons in that partition
            break;
        }
        case 2: {
            const key = Object.keys(existingRegions)[arr[0]]; //fetched the key at index arr[0]
            console.log(`case 2 partition name is ${key}`);
            const partition = existingRegions[key];
            const key2 = Object.keys(partition)[arr[1]]; // fetch the key at index arr[1]
            const wkt = partition[key2].wkt;
            const x = {name: key2, wkt, key: strKey} ;
            console.log('zzz ', x);
            console.log(`zzz pushing object: ${JSON.stringify(x)}`);
            rv.push( x );
            break;
        }
        default:
            assert.fail('selectors/index.js :: impossible');
        }
    });

    return rv;
}


export function existingRegionsAsAntdTreeControlData(state) {
    assert.isDefined(state.regions.existing);
    const rv = reduxRegionsToAntdData(state.regions.existing);
    return rv;
}


// TODO: rename that to isRegionsUninitializedOrRefreshed
// sse-1592816552
export function isRegionsBeingFetched(state) {
    return (state.regions.existing===undefined);
}

export function rgeMode(state) { // region editing mode
    return state.regions.editing.mode;
}

// returns an array of partition names
export function partitions(state) {
    if (isRegionsBeingFetched(state))
        return undefined;
    else
        return Object.keys(state.regions.existing);
}

export function partition2regions(state) {
    const rv = {};
    for (const [key, value] of Object.entries(state.regions.existing)) {
        rv[key] = Object.keys(value); // value.map( (x)=>x.name );
    }
    return rv;
}

export function wktRegionUnderConstruction(state) {
    return state.regions.editing.regionUnderCreation?.wkt ?? null;
}

export function wktRegionUnderConstructionExists(state) {
    return (wktRegionUnderConstruction(state) !== null);
}

export function rgmgmntDuringDeletion(state) {
    return state.regions.editing.duringDeletion;
}

export function rgmgmntDuringModification(state) {
    return state.regions.editing.duringModification;
}

export function rgmgmntSaveEnabled(state) {
    return (wktRegionUnderConstructionExists(state) && (!rgmgmntDuringDeletion(state)) && (!rgmgmntDuringModification(state)));
}

