import React from 'react';
import ReactDOM from 'react-dom';
import Amplify, { Auth, Hub } from 'aws-amplify';
import './index.css';
import * as serviceWorker from './serviceWorker';

var param_client_id="";
var param_user_name="";
var param_confirmation_code="";
var param_firstName="";
var param_lastName="";
var param_staySignIn="";
var param_timezone="";
var param_email="";
var param_type="";

const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');

Amplify.configure({
  Auth: {

      identityPoolId: 'us-east-1:0a15a40c-d4ed-4b10-8ca0-908459290f01',
      region: 'us-east-1',
      identityPoolRegion: 'us-east-1',
      userPoolId: 'us-east-1_xLy7znUKC',
      userPoolWebClientId: '28fqk122l6dod9c1boq1utsps6',
      mandatorySignIn: false,
      authenticationFlowType: 'USER_PASSWORD_AUTH'
  }
});


class Verification extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      message: ''
    };
  }

  verifyEmailWithCode(){
    Auth.verifyCurrentUserAttributeSubmit('email', code)
    .then(() => {
      this.setState({message: 'Email Verified!'})
    }).catch(e => {
      this.setState({message: e.message})
    });
  }

  componentDidMount() {
    window.addEventListener('load', this.verifyEmailWithCode.bind(this));
  }

  render(){
    return(
      <div>
        {this.state.message}
      </div>
    );
  }
}
export default Verification;