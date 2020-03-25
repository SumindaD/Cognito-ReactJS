import React from 'react';
import ReactDOM from 'react-dom';
import Amplify, { Auth, Hub } from 'aws-amplify';
import ReCAPTCHA from "react-google-recaptcha";

const recaptchaRef = React.createRef();

Amplify.configure({
    Auth: {

        // REQUIRED only for Federated Authentication - Amazon Cognito Identity Pool ID
        identityPoolId: 'us-east-1:b660d3ee-0672-4b26-a7c3-6b65ccbc4360',
        
        // REQUIRED - Amazon Cognito Region
        region: 'us-east-1',

        // OPTIONAL - Amazon Cognito Federated Identity Pool Region 
        // Required only if it's different from Amazon Cognito Region
        identityPoolRegion: 'us-east-1',

        // OPTIONAL - Amazon Cognito User Pool ID
        userPoolId: 'us-east-1_ToNFAMmT4',

        // OPTIONAL - Amazon Cognito Web Client ID (26-char alphanumeric string)
        userPoolWebClientId: '18oaqa3cg4l0m1bfhjpv1dghdk',

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
        // oauth: {
        //     domain: 'hanalytics.auth.us-east-1.amazoncognito.com',
        //     // scope: ['phone', 'email', 'profile', 'openid', 'aws.cognito.signin.user.admin'],
        //     redirectSignIn: 'http://localhost:3000/',
        //     redirectSignOut: 'http://localhost:3000/',
        //     responseType: 'code' // or 'token', note that REFRESH token will only be generated when the responseType is code
        // }
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

            // Get ID Token JWT
            Auth.currentSession().then(data => console.log(data.getIdToken().jwtToken));
        })
        .catch(err => console.log(err));
    }

    signInHandler = (event) => {
        this.setState({errormessage: ''});
        event.preventDefault();
        let username = this.state.username
        let password = this.state.password
        let validationData = {gcaptchaResponse: recaptchaRef.current.getValue()}
        // For advanced usage
        // You can pass an object which has the username, password and validationData which is sent to a PreAuthentication Lambda trigger
        Auth.signIn({
            username, // Required, the username
            password, // Optional, the password
            validationData, // Optional, a random key-value pair map which can contain any key and will be passed to your PreAuthentication Lambda trigger as-is. It can be used to implement additional validations around authentication
        }).then(user => 
            {
                console.log(user)

                if (user.challengeName === 'SMS_MFA' ||
                    user.challengeName === 'SOFTWARE_TOKEN_MFA') {
                    // You need to get the code from the UI inputs
                    // and then trigger the following function with a button click
                    var verificationCode = prompt('Enter Verification sent to phone number');
                    // If MFA is enabled, sign-in should be confirmed with the confirmation code
                    Auth.confirmSignIn(
                        user,   // Return object from Auth.signIn()
                        verificationCode,   // Confirmation code  
                        user.challengeName // MFA Type e.g. SMS_MFA, SOFTWARE_TOKEN_MFA
                    ).then(user => {
                        console.log(user)
                        this.setState({signoutVisible: true})
                        this.setState({welcomeMessage: 'Welcome ' + user.username + '!'})
                    });
                }else if(user.challengeName === 'NEW_PASSWORD_REQUIRED'){
                    var newPassword = prompt('Enter new password');

                    Auth.completeNewPassword(user, newPassword).then(user => {
                        console.log(user)
                        this.setState({signoutVisible: true})
                        this.setState({welcomeMessage: 'Welcome ' + user.username + '!'})
                    }).catch(err => {
                        console.log(err)
                        this.setState({errormessage: err.message});
                    })
                }
                else{
                    console.log(user)
                    this.setState({signoutVisible: true})
                    this.setState({welcomeMessage: 'Welcome ' + user.username + '!'})
                }

                
            })
        .catch(err => {
            console.log(err)
            this.setState({errormessage: err.message});

            if (err.code === 'PasswordResetRequiredException') {
                this.initiateForgotPasswordFlow(username)
            }
            else if(err.code == 'UserNotConfirmedException'){
                console.log('Sending sign up code')
                Auth.resendSignUp(username).then(() => {
                    var verificationCode = prompt('Enter Verification sent to email: ' + username);
                    this.confirmUserSignUpWithCode(username, verificationCode)

                }).catch(e => {
                    console.log(e);
                });
            }
        });
    }

    signOut () {
        this.setState({errormessage: ''});
        Auth.signOut().then(data => {
            this.setState({signoutVisible: false})
            this.setState({welcomeMessage: ''})
        })
        .catch(err => console.log(err));
    }

    updatePhoneNumber() {
        this.setState({errormessage: ''});
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

    UpdateEmail() {
        this.setState({errormessage: ''});
        Auth.currentAuthenticatedUser({
            bypassCache: false  // Optional, By default is false. If set to true, this call will send a request to Cognito to get the latest user data
        }).then(user => {
            console.log(user)
            
            var email = prompt('Enter new email');
            const result = Auth.updateUserAttributes(user, {
                'email': email
            }).then(result => {
                console.log(result)
                this.setState({errormessage: result});
            })

            
        })
        .catch(err => console.log(err));
        
    }

    enableMFA() {
        this.setState({errormessage: ''});
        Auth.currentAuthenticatedUser({
            bypassCache: false  // Optional, By default is false. If set to true, this call will send a request to Cognito to get the latest user data
        }).then(user => {
            console.log(user)

            Auth.setPreferredMFA(user, 'SMS').then(result => {
                console.log(result)
                this.setState({errormessage: result});
            })
        })
        .catch(err => console.log(err));
    }

    disableMFA() {
        this.setState({errormessage: ''});
        Auth.currentAuthenticatedUser({
            bypassCache: false  // Optional, By default is false. If set to true, this call will send a request to Cognito to get the latest user data
        }).then(user => {
            console.log(user)

            Auth.setPreferredMFA(user, 'NOMFA').then(result => {
                console.log(result)
                this.setState({errormessage: result});
            })
        })
        .catch(err => console.log(err));
    }

    verifyEmail(){
        this.setState({errormessage: ''});
        // To initiate the process of verifying the attribute like 'phone_number' or 'email'
        Auth.verifyCurrentUserAttribute('email')
        .then(() => {
            this.verifyEmailWithCode()
        }).catch((err) => {
            console.log('failed with error', err);
            this.setState({errormessage: err.message});
        });
    }

    verifyPhoneNumber(){
        this.setState({errormessage: ''});
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
        this.setState({errormessage: ''});
        let username = this.state.username
        this.initiateForgotPasswordFlow(username)
    }

    initiateForgotPasswordFlow(username){
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

    signUpUser(){
        this.setState({errormessage: ''});
        let username = this.state.username
        let password = this.state.password
        
        Auth.signUp({
            username,
            password,
            attributes: {
                'email' : username,          // optional
                //'phone_number': '+14713359107',   // optional - E.164 number convention
                'custom:timezone': '+0530',
                'custom:firstName':'FirstName',
                'custom:staySignIn': 'true'
                // other custom attributes 
            },
            validationData: []  //optional
            })
            .then(data => {
                console.log(data)

                if (data.userConfirmed){
                    this.setState({errormessage: ''});
                    this.setState({welcomeMessage: 'Created Account for ' + username + '! Please log in again.'})
                }else{
                    this.setState({errormessage: ''});
                    var verificationCode = prompt('Enter Verification sent to email: ' + username);

                    this.confirmUserSignUpWithCode(username, verificationCode)
                }
            })
            .catch(err => {
                console.log(err)
                this.setState({errormessage: err.message});
            });
    }

    confirmUserSignUpWithCode(username, verificationCode){
        // After retrieving the confirmation code from the user
        Auth.confirmSignUp(username, verificationCode, {
            // Optional. Force user confirmation irrespective of existing alias. By default set to True.
            forceAliasCreation: true    
        }).then(data => {
            console.log(data)
            this.setState({errormessage: ''});
            this.setState({welcomeMessage: 'Confirmed ' + username + '! Please log in again.'})
        })
        .catch(err => {
            console.log(err)
            this.setState({errormessage: err.message});
        });
    }

    changeEmail(){
        Auth.currentAuthenticatedUser({
            bypassCache: false  // Optional, By default is false. If set to true, this call will send a request to Cognito to get the latest user data
        }).then(user => {
            console.log(user)

            var newEmail = prompt('Enter new email: ');

            Auth.updateUserAttributes(user, {
                'email': newEmail
            }).then(data => {
                this.verifyEmailWithCode()
            })
            .catch(err => {
                console.log(err)
                this.setState({errormessage: err.message});
            });
        })
        .catch(err => console.log(err));
    }

    verifyEmailWithCode(){
        var verificationCode = prompt('Enter Verification sent to email');

        // To verify attribute with the code
        Auth.verifyCurrentUserAttributeSubmit('email', verificationCode)
        .then(() => {
            this.setState({welcomeMessage: ''})
            this.setState({errormessage: 'email verified'});
        }).catch(e => {
            this.setState({errormessage: 'Verification failed'});
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
                
                
                {this.state.errormessage}

                {this.state.welcomeMessage}
            </form>

            {!this.state.signoutVisible ? <button onClick={this.forgotPassword.bind(this)}>Forgot Password</button> : null}
            {!this.state.signoutVisible ? <button onClick={this.signUpUser.bind(this)}>Sign Up</button> : null}
            {this.state.signoutVisible ? <button onClick={this.signOut.bind(this)}>Sign Out</button> : null}

            {this.state.signoutVisible ? <button onClick={this.updatePhoneNumber.bind(this)}>Update Phone Number</button> : null}
            {this.state.signoutVisible ? <button onClick={this.verifyPhoneNumber.bind(this)}>Verify Phone Number</button> : null}
            {this.state.signoutVisible ? <button onClick={this.UpdateEmail.bind(this)}>Update Email</button> : null}
            {this.state.signoutVisible ? <button onClick={this.verifyEmail.bind(this)}>Verify Email</button> : null}
            {this.state.signoutVisible ? <button onClick={this.enableMFA.bind(this)}>Enable MFA</button> : null}
            {this.state.signoutVisible ? <button onClick={this.disableMFA.bind(this)}>Disable MFA</button> : null}
            {this.state.signoutVisible ? <button onClick={this.changeEmail.bind(this)}>Change Email</button> : null}
            <ReCAPTCHA
                sitekey="6LeiqdsUAAAAAIwAd-bO-So5OlQQq3fAlKZgjLo8"
                ref={recaptchaRef}
            />
        </div>
      );
    }
  }


  ReactDOM.render(<CognitoLogin />, document.getElementById('root'));