import chai from './util/chai-util.js';
const assert = chai.assert;



import {sca_fake_return} from './util/util.js';

import {axiosAuth} from './axios-setup.js';

export default function getTreesConfiguration() {
    const url = '/getConfiguration';
    return axiosAuth.get(url).then(res => {
        if (res.data.err != null) {
            console.log('getTreesConfiguration API call error');
            assert.fail(res.data.err);
            return sca_fake_return();
        } else {
            console.log('getTreesConfiguration API call success');
            console.log(res.data);
            return res.data.t;
        }
    }).catch( err => {
        throw err;
    });
}

