import json
import requests

def lambda_handler(event, context):
    print(json.dumps(event))
    
    if(event['triggerSource'] == 'UserMigration_Authentication'):
        url = 'https://play2.hanalyticssolutions.com/api/login'
        myobj = {
                  "emailAddress": event['userName'],    
                  "password": event['request']['password']
                }
        
        x = requests.post(url, data = myobj)
        
        if x.status_code == 200:
            event['response']['userAttributes'] = {
                "email": event['userName'],
                "email_verified": "true"
            }
        
            event['response']['finalUserStatus'] = "RESET_REQUIRED"
            event['response']['messageAction'] = "SUPPRESS"
        else:
            raise Exception('Bad Creds')
            
    # event['response']['messageAction'] = "SUPPRESS"
    return event