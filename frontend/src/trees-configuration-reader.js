const assert = require('chai').assert;


import {sca_fake_return} from './util.js';

import {axiosAuth} from './axios-setup.js';


export default function getTreesConfiguration() {
    const url = '/getTreesConfiguration';
    return axiosAuth.get(url
//                     , {headers: createAxiosAuthHeader()}
                    ).then(res => {
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
                        console.log(err);
                        console.log(JSON.stringify(err));
                        assert.fail(err);
                    });
}

