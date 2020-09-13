import React from 'react';
import ReactDOM from 'react-dom';
// You can choose your kind of history here (e.g. browserHistory)
import { Router, Switch, Route, BrowserRouter } from 'react-router-dom'

import CognitoLogin from './user_authentication.js';
import Verification from './verification.js';

ReactDOM.render((
    <BrowserRouter>
            <Route exact path='/' component={CognitoLogin}/>
            <Route exact path='/email-verification' component={Verification}/>
    </BrowserRouter> 
 ), document.getElementById('root'))