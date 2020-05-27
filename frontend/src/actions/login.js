const assert = require('chai').assert;
import {storeAccessToken} from '../access-token-util.js';
import {axiosPlain} from '../axios-setup.js';

import { clearModal } from './index.js';


export default function login(updateLogin, installation, username, password) {

    return (dispatch) => {
        console.log(`login action creator: login(${installation}, ${username}, ${password}`);
        const url = '/login';
        axiosPlain.post(url, {
            installation: installation,
            username: username,
            password: password
        }).then(res => {
            if (res.data.err != null) {
                console.log('login API call error');
                assert.fail(res.data.err);
            } else {
                console.log('login API call success');
                if (res.data.t.loginFailureReason===null) {
                    storeAccessToken(res.data.t.accessToken);
                    dispatch(clearModal());
                    updateLogin(username);
                } else {
                    console.log('login was unsuccessful');
                    if (false) // TODO: I should be logging these messages on a message / activity tab
                        this.setState({logErrMsg: res.data.t.loginFailureReason});
                }
            }
        }).catch( err => {
            console.log(err);
            console.log(JSON.stringify(err));
            assert.fail(err);
        });
    };
}
