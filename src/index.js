import React from 'react';
import ReactDOM from 'react-dom';
import Amplify, { Auth, Hub } from 'aws-amplify';

Amplify.configure({
    Auth: {

        // REQUIRED only for Federated Authentication - Amazon Cognito Identity Pool ID
        identityPoolId: 'us-east-1:7bc8d683-5e87-4bea-ac5f-1b6ca1cfba7b',
        
        // REQUIRED - Amazon Cognito Region
        region: 'us-east-1',

        // OPTIONAL - Amazon Cognito Federated Identity Pool Region 
        // Required only if it's different from Amazon Cognito Region
        identityPoolRegion: 'us-east-1',

        // OPTIONAL - Amazon Cognito User Pool ID
        userPoolId: 'us-east-1_1z9UKSFCG',

        // OPTIONAL - Amazon Cognito Web Client ID (26-char alphanumeric string)
        userPoolWebClientId: '1s0f1a8c3n9ff5b6dp6suqlin8',

        // OPTIONAL - Enforce user authentication prior to accessing AWS resources or not
        mandatorySignIn: false,

        // OPTIONAL - Configuration for cookie storage
        // Note: if the secure flag is set to true, then the cookie transmission requires a secure protocol
        // cookieStorage: {
        // // REQUIRED - Cookie domain (only required if cookieStorage is provided)
        //     domain: 'localhost:3000',
        // // OPTIONAL - Cookie path
        //     path: '/',
        // // OPTIONAL - Cookie expiration in days
        //     expires: 365,
        // // OPTIONAL - Cookie secure flag
        // // Either true or false, indicating if the cookie transmission requires a secure protocol (https).
        //     secure: true
        // },

        // OPTIONAL - customized storage object
        // storage: new MyStorage(),
        
        // OPTIONAL - Manually set the authentication flow type. Default is 'USER_SRP_AUTH'
        authenticationFlowType: 'USER_PASSWORD_AUTH',

        // OPTIONAL - Manually set key value pairs that can be passed to Cognito Lambda Triggers
        clientMetadata: { myCustomKey: 'myCustomValue' },

         // OPTIONAL - Hosted UI configuration
        oauth: {
            domain: 'hanalytics.auth.us-east-1.amazoncognito.com',
            // scope: ['phone', 'email', 'profile', 'openid', 'aws.cognito.signin.user.admin'],
            redirectSignIn: 'http://localhost:3000/',
            redirectSignOut: 'http://localhost:3000/',
            responseType: 'code' // or 'token', note that REFRESH token will only be generated when the responseType is code
        }
    }
});

class CognitoLogin extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        username: '',
        password: null,
        errormessage: '',
        signoutVisible: false,
        welcomeMessage: ''
      };
    }

    formPropertyChangeHandler = (event) => {
      let nam = event.target.name;
      let val = event.target.value;
      let err = '';

      this.setState({errormessage: err});
      this.setState({[nam]: val});
    }

    componentDidMount () {
        Auth.currentAuthenticatedUser({
            bypassCache: false  // Optional, By default is false. If set to true, this call will send a request to Cognito to get the latest user data
        }).then(user => {
            console.log(user)
            this.setState({signoutVisible: true})
            this.setState({welcomeMessage: 'Welcome ' + user.username + '!'})
        })
        .catch(err => console.log(err));
    }

    signInHandler = (event) => {
        event.preventDefault();
        let username = this.state.username
        let password = this.state.password
        // For advanced usage
        // You can pass an object which has the username, password and validationData which is sent to a PreAuthentication Lambda trigger
        Auth.signIn({
            username, // Required, the username
            password // Optional, the password
            // validationData, // Optional, a random key-value pair map which can contain any key and will be passed to your PreAuthentication Lambda trigger as-is. It can be used to implement additional validations around authentication
        }).then(user => 
            {
                console.log(user)
                this.setState({signoutVisible: true})
                this.setState({welcomeMessage: 'Welcome ' + user.username + '!'})
            })
        .catch(err => {
            console.log(err)
            this.setState({errormessage: err.message});

            if (err.code === 'PasswordResetRequiredException') {
                Auth.forgotPassword(username)
                    .then(data => {
                        console.log(data)
                        var verificationCode = prompt('Enter Verification sent to email: ' + username);
                        var new_password = prompt('Enter new password');

                        Auth.forgotPasswordSubmit(username, verificationCode, new_password)
                        .then(data => {
                            console.log(data)
                            this.setState({errormessage: ''});
                            this.setState({welcomeMessage: 'Confirmed ' + username + '! Please log in again.'})
                        })
                        .catch(err => {
                            console.log(err)
                            this.setState({errormessage: err.message});
                        });
                    })
                    .catch(err => {
                        console.log(err)
                        this.setState({errormessage: err.message});
                    });
            }
        });
    }

    signOut () {
        Auth.signOut().then(data => {
            this.setState({signoutVisible: false})
            this.setState({welcomeMessage: ''})
        })
        .catch(err => console.log(err));
    }

    updatePhoneNumber() {
        Auth.currentAuthenticatedUser({
            bypassCache: false  // Optional, By default is false. If set to true, this call will send a request to Cognito to get the latest user data
        }).then(user => {
            console.log(user)
            
            var phoneNumber = prompt('Enter phoner number');
            const result = Auth.updateUserAttributes(user, {
                'phone_number': phoneNumber
            }).then(result => {
                console.log(result)
                this.setState({errormessage: result});
            })

            
        })
        .catch(err => console.log(err));
        
    }

    verifyPhoneNumber(){
        // To initiate the process of verifying the attribute like 'phone_number' or 'email'
        Auth.verifyCurrentUserAttribute('phone_number')
        .then(() => {
            var verificationCode = prompt('Enter Verification sent to phone number');

            // To verify attribute with the code
            Auth.verifyCurrentUserAttributeSubmit('phone_number', verificationCode)
            .then(() => {
                this.setState({welcomeMessage: ''})
                this.setState({errormessage: 'phone_number verified'});
            }).catch(e => {
                this.setState({errormessage: 'Verification failed'});
            });

        }).catch((err) => {
            console.log('failed with error', err);
            this.setState({errormessage: err.message});
        });
    }

    forgotPassword(){
        let username = this.state.username
        Auth.forgotPassword(username)
                    .then(data => {
                        console.log(data)
                        var verificationCode = prompt('Enter Verification sent to email: ' + username);
                        var new_password = prompt('Enter new password');

                        Auth.forgotPasswordSubmit(username, verificationCode, new_password)
                        .then(data => {
                            console.log(data)
                            this.setState({errormessage: ''});
                            this.setState({welcomeMessage: 'Confirmed ' + username + '! Please log in again.'})
                        })
                        .catch(err => {
                            console.log(err)
                            this.setState({errormessage: err.message});
                        });
                    })
                    .catch(err => {
                        console.log(err)
                        this.setState({errormessage: err.message});
                    });
    }

    render() {
      return (
        <div>
            <form onSubmit={this.signInHandler}>
                <h1>Cognito Login</h1>

                <p>Username:</p>

                <input
                    type='text'
                    name='username'
                    onChange={this.formPropertyChangeHandler}
                />
                
                <p>Password:</p>

                <input
                    type='text'
                    name='password'
                    onChange={this.formPropertyChangeHandler}
                />

                {!this.state.signoutVisible ? <input type='submit' value='Login' /> : null}
                {!this.state.signoutVisible ? <button onClick={this.forgotPassword.bind(this)}>Forgot Password</button> : null}
                
                {this.state.errormessage}

                {this.state.welcomeMessage}
            </form>

            {this.state.signoutVisible ? <button onClick={this.signOut.bind(this)}>Sign Out</button> : null}

            {this.state.signoutVisible ? <button onClick={this.updatePhoneNumber.bind(this)}>Update Phone Number</button> : null}
            {this.state.signoutVisible ? <button onClick={this.verifyPhoneNumber.bind(this)}>Verify Phone Number</button> : null}
        </div>
      );
    }
  }


  ReactDOM.render(<CognitoLogin />, document.getElementById('root'));