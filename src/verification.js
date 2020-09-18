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
const username = urlParams.get('username');
const hasura_id = urlParams.get('hasura_id');

Amplify.configure({
  Auth: {

      identityPoolId: 'us-west-2:cc37a222-0c55-4797-999a-4eb7874168d1',
      region: 'us-west-2',
      identityPoolRegion: 'us-west-2',
      userPoolId: 'us-west-2_rPQE7thyI',
      userPoolWebClientId: '6ajlnb2ph4obsa5jo94fqbqqlj',
      mandatorySignIn: false,
      authenticationFlowType: 'USER_PASSWORD_AUTH',
      clientMetadata: {
            user_role: "enduser",
            hasura_id: hasura_id
        }
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
    //Auth.verifyCurrentUserAttributeSubmit('email', code)
    Auth.confirmSignUp(username, code, {
      // Optional. Force user confirmation irrespective of existing alias. By default set to True.
      forceAliasCreation: true
  }).then(data => {
      console.log(data)
      this.setState({ message: '' });
      this.setState({ welcomeMessage: 'Confirmed ' + username + '! Please log in again.' })
  })
      .catch(err => {
          console.log(err)
          this.setState({ message: err.message });
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