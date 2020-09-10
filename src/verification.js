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

var query = window.location.search.substring(1);
console.log(query);
var vars = query.split("&");

for (var i=0;i<vars.length;i++) {
  var pair = vars[i].split("=");
  console.log(pair)

  if(pair[0] == "client_id"){
    param_client_id = pair[1];
  }
  else if(pair[0] == "user_name"){
    param_user_name = pair[1];
  }
  else if(pair[0] == "confirmation_code"){
    param_confirmation_code = pair[1];
  }
  else if(pair[0] == "firstName"){
    param_firstName = pair[1];  
  }
  else if(pair[0] == "lastName"){
    param_lastName = pair[1];
  }
  else if(pair[0] == "staySignIn"){
    param_staySignIn = pair[1];
  }
  else if(pair[0] == "timezone"){
    param_timezone = pair[1];
  }
  else if(pair[0] == "email"){
    param_email = pair[1];
  }
  else if(pair[0] == "type"){
    param_type = pair[1];
  }
}

console.log(param_client_id + " --- " + param_user_name + " --- " + param_confirmation_code + " --- " + param_firstName + " --- " + param_lastName + " --- " + param_staySignIn + " --- " + param_timezone);

Amplify.configure({
  Auth: {

      identityPoolId: 'us-east-1:8ed96ef1-7bf5-44b5-9f9b-623b245d371c',
      region: 'us-east-1',
      identityPoolRegion: 'us-east-1',
      userPoolId: 'us-east-1_hdA29vmF5',
      userPoolWebClientId: '5bsm958ggrhl7fu4dhmn8n39pj',
      mandatorySignIn: false,
      authenticationFlowType: 'USER_PASSWORD_AUTH',

      clientMetadata: {
        firstName: 'Dilshan',
        lastName: 'Wijesinghe',
        staySignIn: 'false',
        timezone: 'timeZone',
        //accessCode: param_confirmation_code,
      },
  }
});


class Verification extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      password: '',
      errormessage: '',
      signoutVisible: false,
      welcomeMessage: ''
    };
  }

  executeVerification(){

    if(param_type == "account_verification"){
      this.signUpUser();
    }

    else if(param_type == "email_verification"){
      this.verifyEmailWithCode();
    }
  }


  signUpUser(){
    this.setState({errormessage: ''});

    console.log(param_confirmation_code)
    Auth.confirmSignUp(
      param_user_name,
      param_confirmation_code
    )
    .then(data => {
        console.log(data)

    })
    .catch(err => {
        console.log(err)
        this.setState({errormessage: err.message});
    });
  }

//   verifyEmail(){
//     Auth.verifyCurrentUserAttribute('email')
//     .then(() => {
//         this.verifyEmailWithCode()
//     }).catch((err) => {
//       console.log(err);
//     });
// }

  verifyEmailWithCode(){
    console.log(param_confirmation_code)
    Auth.verifyCurrentUserAttributeSubmit('email', param_confirmation_code)
    .then(() => {
      console.log('Email verified');
    }).catch(e => {
      console.log(e);
    });

  }

  render(){
    return(
      <div>
      {!this.state.signoutVisible ? <button onClick={this.executeVerification.bind(this)}>Validate</button> : null}
      </div>
      );
  }
}
export default Verification;

