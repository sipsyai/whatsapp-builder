# Implementing Endpoints for Flows - WhatsApp Flows - Documentation - Meta for Developer

## Implementing Endpoint for Flows

This guide explains how to implement an Endpoint to power WhatsApp Flows.

Please note that Flows with an endpoint are subject to both reliability and performance requirements. For additional information, refer to the [Flows Health and Monitoring guide](https://developers.facebook.com/docs/whatsapp/flows/guides/healthmonitoring).

## Endpoint Examples

### Basic Endpoint Example

We have created an endpoint example in Node.js that you can clone to create your own endpoint and quickly prototype your flow. Follow the instructions in the README.md file to get started. You can clone the [example code from Github](https://l.facebook.com/l.php?u=https%3A%2F%2Fgithub.com%2FWhatsApp%2FWhatsApp-Flows-Tools%2Ftree%2Fmain%2Fexamples%2Fendpoint%2Fnodejs%2Fbasic%3Ffbclid%3DIwZXh0bgNhZW0CMTEAYnJpZBExam5ydzFua3pNTUw3N2RJNnNydGMGYXBwX2lkATAAAR5hS2NRKeedcq437aCN84HvZ1gd78roqr0jdBEf0UfkKWZDq2CbbCPuNOnqzA_aem_6bZqWzUCDUN4SQLzl_P69g&h=AT0WhljQImgsHMT0hH1AfpQ-aT_YCxcy0CRx84xqj2fJ61bUmh-acXO1oFslCRchIlr8KjZSskifVW0WBdyvQtj8yrfj5kRnwToTJ6CaJglum-iTRVhkUZvQ0pV9UwWnunQvRg) and run it in any environment you prefer.

### "Book an Appointment" Endpoint Example

We also provide endpoint code that can be used along with the ["Book an Appointment" flow JSON template](https://developers.facebook.com/docs/whatsapp/flows/examples/templates#book-an-appointment) to complete the flow from start to finish. Follow the instructions in the README.md file to get started. You can clone the [example code from Github](https://l.facebook.com/l.php?u=https%3A%2F%2Fgithub.com%2FWhatsApp%2FWhatsApp-Flows-Tools%2Ftree%2Fmain%2Fexamples%2Fendpoint%2Fnodejs%2Fbook-appointment%3Ffbclid%3DIwZXh0bgNhZW0CMTEAYnJpZBExam5ydzFua3pNTUw3N2RJNnNydGMGYXBwX2lkATAAAR69ZySifKZ2parfo2aNBlAlZWrYxhIIcPuSIlMCL1KY5JbVGbQnWjm5FySioQ_aem_aFvHojVrglfDfEXtkXWCGw&h=AT0hynPK37FdM_6UfH9221zyyDpOj1znZZDW-ZRLUybxr8kOATviqkt4C9DZTWKg3elc0YcLrwJnkpQz_ehpow3wPzgDWVxPn9ct-EJnG8_O2oJw4sTwijXZVsSvdYhvqO32Tw) and run it in any environment you prefer.

## Set up an Endpoint

Endpoints provide dynamic data for the screens and control routing, i.e. upon screen submission, the flow can make a request to the endpoint to get the name of the next screen and the data to display on it. Also, the endpoint can instruct the flow to terminate and control whether an outgoing message should be sent to a chat as a result of the flow completion. The endpoint can additionally provide a data payload to be passed with a completion message.

Setting up an endpoint consists of the following steps:

1.  Create a key pair and upload and sign the public key using [On-Prem](https://developers.facebook.com/docs/whatsapp/on-premises/reference/settings/business-whatsapp-business-encryption) or the [Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/whatsapp-business-encryption#set-business-public-key).
2.  [Setup the HTTP endpoint](#setup).
3.  [Implement Payload Encryption/Decryption](#encrypt).
4.  Link the endpoint to your flow:  -   specify 
          ```
          data_api_version
          ```
           in the Flow JSON and configure endpoint url, see [reference](https://developers.facebook.com/docs/whatsapp/flows/reference/flowjson#top-level-flow-json-properties) for more details.
      9.   if the Flow was created through WhatsApp Manager, connect Meta App to it in "Edit Flow" page, see [Flow Builder UI](https://developers.facebook.com/docs/whatsapp/flows/introduction/flowbuilderui#flows-builder) for more details.

After setting up an endpoint, implement it's logic to handle requests:

-   [Data Exchange](#data_exchange_request)
-   [Error Notification](#error_notification_request)
-   [Health Check](#health_check_request)

### Upload Public Key

Data exchanged with an endpoint is encrypted using a combination of symmetric and asymmetric encryption. You should have a key pair to enable encryption and upload the public key. It will be automatically signed along the way.

Since Solution Partners manage multiple businesses, it's recommended to have a dedicated endpoint and an encryption key pair for each WABA.

Please ensure you have the versions specified below when signing the business public key.

 Tool | Required Version |
| --- | --- |
 
On-Prem API

 | 

v2.51.x

 |

Uploading and signing the business public key is different for On-Prem and Cloud, so depending on your API client please refer to the appropriate guide:

**Sign and upload the business public key**

-   [On-Prem](https://developers.facebook.com/docs/whatsapp/on-premises/reference/settings/business-whatsapp-business-encryption)
-   [Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/whatsapp-business-encryption#set-business-public-key)

You will need to re-upload public key in the following cases:

-   When you re-register your number on On-Prem or Cloud API.
-   When you migrate your number from On-Prem to Could API or vice versa.
-   When you start receiving webhooks with alerts about client side errors 
    ```
    public-key-missing
    ```
     or 
    ```
    public-key-signiture-verification
    ```
    .

### Setup HTTP Endpoint

When the flow will need to exchange the data with your endpoint, it will make an HTTP request to it. You should set up a server and provide it's url while configuring the flow, for example:

```
https://business.com/scheduleappointment
```

Your server must be enabled to receive and process 
```
POST
```
 requests, use HTTPS and have a valid TLS/SSL certificate installed. This certificate does not have to be used in payload encryption/decryption.

### Implement Encryption/Decryption

The body of each request contains the encrypted payload and has the following form:

**Sample Endpoint Request**

```
{
    encrypted\_flow\_data: "<ENCRYPTED FLOW DATA>",
    encrypted\_aes\_key: "<ENCRYPTED\_AES\_KEY>",
    initial\_vector: "<INITIAL VECTOR>"
 }
```

 Parameter | Description |
| --- | --- |
 
```
encrypted_flow_data
```

_string_

 | 

**Required.** The encrypted request payload.

 |
 

```
encrypted_aes_key
```

_string_

 | 

**Required.** The encrypted 128-bit AES key.

 |
 

```
initial_vector
```

_string_

 | 

**Required.** The 128-bit initialization vector.

 |

After processing the decrypted request, create a response and encrypt it before sending it back to the WhatsApp client. Encrypt the payload using the AES key received in the request and send it back as a Base64 string.

You can reference the below examples of [how to decrypt and encrypt](#request-decryption-and-encryption).

If request can not be decrypted, endpoint should return HTTP 421 response status code (see [Business Endpoint Error Codes](https://developers.facebook.com/docs/whatsapp/flows/reference/error-codes#endpoint_error_codes) for more details).

**Sample Endpoint Response**

```
curl \-i \-H "Content-Type: application/json" \-X POST \-d '{
"encrypted\_flow\_data":"4Wor0bpfvrNqnkH+XQZLn3HnU2Zi7hG\\\\/UHjISS93Fzn9J7youssaLeXlNUH",
"encrypted\_aes\_key":"<ufA0fXD1WzMS4f2aCyr2JI4KtV2X+puen78fLjjt7mI+NqITDCypLOlc2MLc0899ApX5FZI78Yp5ZObEvR\\\\/3SiOo04aOLAcZ5SGlqcQLL1npaHoTZCBkExjDr0+5F7w+a18hLCByc00nuDoVZvX7qKAYTwDJw==.>",
"initial\_vector":"<G\\\\/1rq1naEOMR4TJHFvIs\\\\/Q==.>"
}' 'https://business.com/testing\_flow'

HTTP/2 200
content\-type: text/plain
content\-length: 232
date: Wed, 06 Jul 2022 14:03:03 GMT

yZcJQaH3AqfzKgjn64vAcASaJrOMN27S6CESyU68WN/cDCP6abskoMa/pPjszXGKyyh/23lw84HW6ZilMfU6KL3j5AWwOx6GWNwtq8Aj7gz/Y7R+LccmJWxKo2UccMu5xJlduIFlFlOS1gAnOwKrk8wpuprsi4jAOspw3xO2uh3J883aC/csu/MhRPiYCaGGy/tTNvVDmb2Gw1WXFmpvLsZ/SBrgG0cDQJjQzpTO

```

## Implement Endpoint Logic

Endpoint-powered Flows should avoid using the endpoint when it is not needed. This will reduce the latency for consumers and simplify the development of the Flow.

Your endpoint will receive requests in the following cases:

1.  User opens the flow:  -   If 
          ```
          flow_action
          ```
           field in the parameters that you pass to On-Prem or CAPI when sending a flow message is 
          ```
          data_exchange
          ```
          ;
      10.   See [Data Exchange Request](#data_exchange_request) for details.
      11.   Tip: If the first screen of your flow does not have any parameters or the parameters are known when the message is sent, consider omitting 
          ```
          flow_action
          ```
           to avoid calling your endpoint. You can supply parameters by using the 
          ```
          flow_action_payload.data
          ```
           message field instead.
    
2.  User submits the screen:  -   If 
          ```
          name
          ```
           attribute specified inside 
          ```
          on-click-action
          ```
           field in Flow JSON is 
          ```
          data_exchange
          ```
          ;
      34.   See [Data Exchange Request](#data_exchange_request) for details.
      35.   Tip: If the next screen and its data are known already, consider setting the 
          ```
          on-click-action
          ```
           name to 
          ```
          navigate
          ```
           to avoid calling your endpoint.
    
3.  User presses back button on the screen:  -   If 
          ```
          refresh_on_back
          ```
           attribute specified in Flow JSON for the screen is 
          ```
          true
          ```
          ;
      54.   See [Data Exchange Request](#data_exchange_request) for details.
      55.   Tip: If custom behavior when pressing the back button is not needed, consider omitting 
          ```
          refresh_on_back
          ```
           to avoid calling your endpoint.
    
4.  User changes the value of a component:  -   If 
          ```
          on-select-action
          ```
           for the component is defined in Flow JSON.
    
5.  Your endpoint replied with invalid content to the previous request (e.g. required field was missing), in this case consumer client will send asynchronous error notification request:  -   See [Error Notification Request](#error_notification_request).
    
6.  Periodical health check from WhatsApp:  -   See [Health Check Request](#health_check_request)

### Data Exchange Request

Data exchange request is used to query the name of the next screen and data required to render it. Decrypted payload of the data exchange request will have below format.

**Sample Data Exchange Request Payload**

```
{
    "version": "<VERSION>",
    "action": "<ACTION\_NAME>",
    "screen": "<SCREEN\_NAME>",
    "data": {
      "prop\_1": "value\_1",
       …
      "prop\_n": "value\_n"
    },
   "flow\_token": "<FLOW-TOKEN>"
}
```

 Parameter | Description |
| --- | --- |
 
```
version
```

_string_

 | 

**Required.** Value must be set to 
```
3.0
```
.

 |
 

```
screen
```

_string_

 | 

**Required.** If 
```
action
```
 is set to 
```
INIT
```
 or 
```
BACK
```
, this field may not be populated. (Note: "SUCCESS" is a reserved name and cannot be used by any screens.)

 |
 

```
action
```

_string_

 | 

**Required.** Defines the type of the request. For data exchange request there are multiple choices depending on when the trigger:

-   ```
    INIT
    ```
     if the request is triggered when opening the Flow
-   ```
    BACK
    ```
     if the request is triggered when pressing "back"
-   ```
    data_exchange
    ```
     if the request is triggered when submitting the screen
 |
 

```
data
```

_object_

 | 

**Required.** An object passing arbitrary key-value data as a JSON object. If 
```
action
```
 is set to 
```
INIT
```
 or 
```
BACK
```
, this field may not be populated.

```
<key>
```
 _string, boolean, number, object, array_ - 
```
<value>
```


 |
 

```
flow_token
```

_string_

 | 

**Required.** A Flow token generated and sent by you as part of the Flow message.

The flow token is similar to a session identifier commonly used in web applications. It should be generated using established best practices (e.g. it should not be predictable) to ensure the security of data exchanges with an endpoint.

 |
 

```
flow_token_signature
```

_string_

 | 

Please note that flow\_token\_signature will only be sent with flows version >= 7.3 and data\_api\_version >=4.0.

A Flow token signature is generated and sent by flows as part of the data exchange request payload.

The flow\_token\_signature is a JSON Web Token (JWT) created by flows to securely sign the flow token using the Meta app secret as the secret key. You can choose to use this signature to verify the authenticity of the flow token. (see [Flow token Signature](#enhanced-endpoint-security) for more details)

 |

After the request is received and decrypted, your business logic processes the request and determines which screen and data is to be sent back to the WhatsApp client. If user needs to be redirected to the next screen, next screen response payload should be sent. If flow needs to be terminated (e.g. because it's completed), final response payload should be sent.

**Next Screen Response Payload for Data Exchange Request**

The following response payload is what the data channel needs to send back to the Whatsapp client during each data exchange, except the last one:

```
{
    "screen": "<SCREEN\_NAME>",
    "data": {
      "property\_1": "value\_1",
       ...
      "property\_n": "value\_n",
      "error\_message": "<ERROR-MESSAGE>"
    }
}
```

If the data channel cannot process the request due to bad input, handle it gracefully by including an optional 
```
error_message
```
 in the 
```
data
```
 object as part of the response.

This will redirect the user to 
```
<SCREEN_NAME>
```
 and will trigger a snackbar error with the 
```
error_message
```
 present.

 Parameter | Description |
| --- | --- |
 
```
screen
```

_string_

 | 

**Required.** The screen to be rendered once the data exchange is complete.

 |
 

```
data
```

_object_

 | 

**Required.** A JSON of properties and its values to render the screen after data exchange is complete.

-   ```
    error_message
    ```
     _string_ – If a bad request was sent from the WhatsApp client to you, the error message will be defined here.
-   ```
    <key>
    ```
     _string, boolean, number, object, array_ – 
    ```
    <value>
    ```
    : A property and its respective value which can be referenced in screen layout in Flow JSON.
 |

**Final Response Payload**

To trigger flow completion, send the following response to the data exchange request:

```
{
    "screen": "SUCCESS",
    "data": {
        "extension\_message\_response": {
            "params": {
                "flow\_token": "<FLOW\_TOKEN>",
                "optional\_param1": "<value1>",
                "optional\_param2": "<value2>"
            }
        }
    }
}
```

 Parameter | Description |
| --- | --- |
 
```
screen
```

_string_

 | 

Value must be 
```
SUCCESS
```


 |
 

```
data.extension_message_response.params
```

_object_

 | 

A JSON with data which will be included to the flow completion message (see [Response Message Webhook](https://developers.facebook.com/docs/whatsapp/flows/reference/responsemsgwebhook) for more details)

 |
 

```
data.extension_message_response.params.flow_token
```

_string_

 | 

**Required.** Flow token generated by a business signifying a session or a user flow

 |

As a result, flow will be closed and a flow response message will be sent to the chat. See [Response Message Webhook](https://developers.facebook.com/docs/whatsapp/flows/reference/responsemsgwebhook) for additional details.

**It is highly recommended that you manually send a summary message to the chat with consumer in response, such as the one below:**

![](https://lookaside.fbsbx.com/elementpath/media/?media_id=760617438961490&version=1757513046)

If you need parameters from the data channel for the message content, you can send them in the 
```
params
```
 field in addition to 
```
flow_token
```
. All these parameters are forwarded to the messages webhook.

### Error Notification Request

If you send a bad response payload to the WhatsApp client, you will receive a payload detailing the error and the error type. This provides you more visibility on failed client interactions so you can respond appropriately.

**Sample Error Notification Request Payload**

```
{
    "version": "<VERSION>",
    "flow\_token": "<FLOW-TOKEN>",
    "action": "data\_exchange | INIT",
    "data": {
        "error": "<ERROR-KEY>",
        "error\_message": "<ERROR-MESSAGE>"
    }
}    
```

 Parameter | Description |
| --- | --- |
 
```
version
```

_string_

 | 

**Required.** 3.0

 |
 

```
screen
```

_string_

 | 

**Required.** Screen name where bad intermediate response payload was sent

 |
 

```
flow_token
```

_string_

 | 

**Required.** A flow token generated by your business

 |
 

```
action
```

_string_

 | 

**Required.** Will be 
```
"data_exchange"
```
 or 
```
"INIT"
```


 |
 

```
data
```

_object_

 | 

**Required.** 
```
data
```
 object representing the error.

-   ```
    data.error_key
    ```
     _string_ – The error code for the invalid payload.
-   ```
    data.error_message
    ```
     _string_ – The error message associated with the error code.
 |

**Error Notification Response Payload**

Send the following response payload to indicate that error notification was acknowledged:

```
{
    "data": {
        "acknowledged": true
    }
}
```

### Health Check Request

Endpoints should be able to respond to health check requests. WhatsApp may periodically send health check requests to the endpoints used by published flows.

**Sample Health Check Request Payload**

```
{
    "version": "3.0",
    "action": "ping"
}
```

You should generate the following response payload:

**Health Check Response Payload**

```
{
    "data": {
        "status": "active"
    }
}

```

## Request Signature Validation

When creating your app, decide who owns it and the endpoint, whether it is you or the Solution Partner. In order to prevent sharing of the app secret, the owners must be the same for both to use the app secret to validate the payload.

You can verify that request is coming from Meta by checking signature which is generated using an [app secret](https://developers.facebook.com/docs/facebook-login/security/#appsecret) from the app connected to the flow. It is inferred from the user token when the flow is created through API, or selected manually in the Flow Builder when endpoint is added to the flow.

**Signature and Header Format**

We sign all endpoint requests with a **SHA256** signature and include the signature in the request's 
```
X-Hub-Signature-256
```
 header, preceded with 
```
sha256=
```
.

To validate the signature:

1.  Generate a **SHA256** signature using the payload and your app secret.
2.  Compare your signature to the signature in the 
    ```
    X-Hub-Signature-256
    ```
     header (everything after 
    ```
    sha256=
    ```
    ). If the signatures match, the payload is genuine.

If validation failes, appropriate HTTP code should be returned. Please see the [Business Endpoint Error Codes](https://developers.facebook.com/docs/whatsapp/flows/reference/error-codes#endpoint_error_codes) for more details.

### Resetting the App Secret

If you need to [reset the app secret](https://developers.facebook.com/docs/development/create-an-app/app-dashboard/basic-settings/#app-secret) without any downtime and without turning off payload validation, you may use below approach:

1.  Allow the old app secret to continue generating the **SHA256** signature for _X_ hours
2.  Temporary consider 
    ```
    X-Hub-Signature-256
    ```
     header to be correct if it can be validated using either old or new app secret.
3.  After _X_ hours (not earlier), consider the signature in the 
    ```
    X-Hub-Signature-256
    ```
     header correct only if it can be validated using new app secret.

## Flow token signature

### flow\_token\_signature for enhanced endpoint authentication

To enhance the security and integrity of flow interactions, we are introducing a parameter called flow\_token\_signature. This signature allows businesses to verify the authenticity of the flow token received in the message payload.

### What is flow\_token\_signature?

The flow\_token\_signature is a JSON Web Token (JWT) created bty flows to securely sign the flow token using the Meta app secret as the secret key. This JWT includes a header specifying the signing algorithm (HS256), a payload containing the flow token. It enables businesses to verify the authenticity and integrity of the flow token received in the message payload, ensuring the token has not been tampered with during transmission.

### How to use?

The flow\_token\_signature is a parameter sent by flows and included in the data exchange request payload. Businesses can choose to use this signature to verify the authenticity of the flow token. To do so, businesses need to decode and verify the JWT using the Meta app secret, which is known to them. Once decoded, businesses can confirm that the flow\_token value inside the token matches the expected value, ensuring the token has not been tampered with during transmission.

## Request Decryption and Encryption

The incoming request body is encrypted, you need to decrypt it first, then you need to encrypt the server response before returning it to the client.

You can find code examples of decryption/encryption in various programming languages in the [Code Examples](#code-examples) section.

For data\_api\_version "3.0" you should follow below instructions to decrypt request payload:

1.  extract payload encryption key from 
    ```
    encrypted_aes_key
    ```
     field:  -   decode base64-encoded field content to byte array;
      6.   decrypt resulting byte array with the private key corresponding to the [uploaded](#upload_public_key) public key using RSA/ECB/OAEPWithSHA-256AndMGF1Padding algorithm with SHA256 as a hash function for MGF1;
      7.   as a result, you'll get a 128-bit payload encryption key.
    
2.  decrypt request payload from 
    ```
    encrypted_flow_data
    ```
     field:  -   decode base64-encoded field content to get encrypted byte array;
      14.   decrypt encrypted byte array using AES-GCM algorithm, payload encryption key and initialization vector passed in 
          ```
          initial_vector
          ```
           field (which is base64-encoded as well and should be decoded first). Note that the 128-bit authentication tag for the AES-GCM algorithm is appended to the end of the encrypted array.
      19.   result of above step is UTF-8 encoded clear request payload.

For data\_api\_version "3.0" you should follow below instructions to encrypt the response:

-   encode response payload string to response byte array using UTF-8
-   prepare initialization vector for response encryption by inverting all bits of the initialization vector used for request payload encryption
-   encrypt response byte array using AES-GCM algorithm with the following parameters:
    
      -   secret key - payload encryption key from request decryption stage
      -   initialization vector for response encryption from above step
      -   empty AAD (additional authentication data) - many libraries assume this by default, check the documentation of the library in use
      -   128-bit (16 byte) length for authentication tag - many libraries assume this by default, check the documentation of the library in use
    
-   append authentication tag generated during encryption to the end of the encryption result
    
-   encode the whole output as base64 string and send it in the HTTP response body as plain text

### Handling Decryption Errors

If you can't decrypt a request, you should send appropriate HTTP response code to force mobile client to re-download public key and retry the query. See [endpoint error codes](https://developers.facebook.com/docs/whatsapp/flows/reference/error-codes#endpoint_error_codes) for additional details.

### Code Examples

A full example of a Node.js endpoint server is [available here](#example). Below are some examples demonstrating how request encryption/decryption can be implemented in different languages.

The below code examples are only meant to demonstrate the encryption/decryption implementation and are not production ready.

### Python Django Example

Here's a full code sample to handle a request with decryption/encryption in Python with Django framework. Note that the response is sent as a plain text string.

```
import json
import os
from base64 import b64decode, b64encode
from cryptography.hazmat.primitives.asymmetric.padding import OAEP, MGF1, hashes
from cryptography.hazmat.primitives.ciphers import algorithms, Cipher, modes
from cryptography.hazmat.primitives.serialization import load\_pem\_private\_key
from django.http import HttpResponse
from django.http import JsonResponse
from django.views.decorators.csrf import csrf\_exempt

\# Load the private key string
PRIVATE\_KEY \= os.environ.get('PRIVATE\_KEY')
\# Example:
\# '''-----BEGIN RSA PRIVATE KEY-----
\# MIIE...
\# ...
\# ...AQAB
\# -----END RSA PRIVATE KEY-----'''
  

@csrf\_exempt
def data(request):
    try:
        \# Parse the request body
        body \= json.loads(request.body)

        \# Read the request fields
        encrypted\_flow\_data\_b64 \= body\['encrypted\_flow\_data'\]
        encrypted\_aes\_key\_b64 \= body\['encrypted\_aes\_key'\]
        initial\_vector\_b64 \= body\['initial\_vector'\]

        decrypted\_data, aes\_key, iv \= decrypt\_request(
            encrypted\_flow\_data\_b64, encrypted\_aes\_key\_b64, initial\_vector\_b64)
        print(decrypted\_data)

        \# Return the next screen & data to the client
        response \= {
            "screen": "SCREEN\_NAME",
            "data": {
                "some\_key": "some\_value"
            }
        }

        \# Return the response as plaintext
        return HttpResponse(encrypt\_response(response, aes\_key, iv), content\_type\='text/plain')
    except Exception as e:
        print(e)
        return JsonResponse({}, status\=500)

def decrypt\_request(encrypted\_flow\_data\_b64, encrypted\_aes\_key\_b64, initial\_vector\_b64):
    flow\_data \= b64decode(encrypted\_flow\_data\_b64)
    iv \= b64decode(initial\_vector\_b64)

    \# Decrypt the AES encryption key
    encrypted\_aes\_key \= b64decode(encrypted\_aes\_key\_b64)
    private\_key \= load\_pem\_private\_key(
        PRIVATE\_KEY.encode('utf-8'), password\=None)
    aes\_key \= private\_key.decrypt(encrypted\_aes\_key, OAEP(
        mgf\=MGF1(algorithm\=hashes.SHA256()), algorithm\=hashes.SHA256(), label\=None))

    \# Decrypt the Flow data
    encrypted\_flow\_data\_body \= flow\_data\[:-16\]
    encrypted\_flow\_data\_tag \= flow\_data\[-16:\]
    decryptor \= Cipher(algorithms.AES(aes\_key),
                       modes.GCM(iv, encrypted\_flow\_data\_tag)).decryptor()
    decrypted\_data\_bytes \= decryptor.update(
        encrypted\_flow\_data\_body) + decryptor.finalize()
    decrypted\_data \= json.loads(decrypted\_data\_bytes.decode("utf-8"))
    return decrypted\_data, aes\_key, iv

def encrypt\_response(response, aes\_key, iv):
    \# Flip the initialization vector
    flipped\_iv \= bytearray()
    for byte in iv:
        flipped\_iv.append(byte ^ 0xFF)

    \# Encrypt the response data
    encryptor \= Cipher(algorithms.AES(aes\_key),
                       modes.GCM(flipped\_iv)).encryptor()
    return b64encode(
        encryptor.update(json.dumps(response).encode("utf-8")) +
        encryptor.finalize() +
        encryptor.tag
    ).decode("utf-8")

```

### NodeJS Express Example

Here's a full code sample to handle a request with decryption/encryption in NodeJS with Express framework. Note that the response is sent as a plain text string.

```
import express from "express";
import crypto from "crypto";

const PORT \= 3000;
const app \= express();
app.use(express.json());

const PRIVATE\_KEY \= process.env.PRIVATE\_KEY as string;
/\* 
Example:
\`\`\`-----BEGIN RSA PRIVATE KEY-----
MIIE...
...
...AQAB
-----END RSA PRIVATE KEY-----\`\`\`
\*/

app.post("/data", async ({ body }, res) \=> {
  const { decryptedBody, aesKeyBuffer, initialVectorBuffer } \= decryptRequest(
    body,
    PRIVATE\_KEY,
  );

  const { screen, data, version, action } \= decryptedBody;
  // Return the next screen & data to the client
  const screenData \= {
    screen: "SCREEN\_NAME",
    data: {
      some\_key: "some\_value",
    },
  };

  // Return the response as plaintext
  res.send(encryptResponse(screenData, aesKeyBuffer, initialVectorBuffer));
});

const decryptRequest \= (body: any, privatePem: string) \=> {
  const { encrypted\_aes\_key, encrypted\_flow\_data, initial\_vector } \= body;

  // Decrypt the AES key created by the client
  const decryptedAesKey \= crypto.privateDecrypt(
    {
      key: crypto.createPrivateKey(privatePem),
      padding: crypto.constants.RSA\_PKCS1\_OAEP\_PADDING,
      oaepHash: "sha256",
    },
    Buffer.from(encrypted\_aes\_key, "base64"),
  );

  // Decrypt the Flow data
  const flowDataBuffer \= Buffer.from(encrypted\_flow\_data, "base64");
  const initialVectorBuffer \= Buffer.from(initial\_vector, "base64");

  const TAG\_LENGTH \= 16;
  const encrypted\_flow\_data\_body \= flowDataBuffer.subarray(0, \-TAG\_LENGTH);
  const encrypted\_flow\_data\_tag \= flowDataBuffer.subarray(-TAG\_LENGTH);

  const decipher \= crypto.createDecipheriv(
    "aes-128-gcm",
    decryptedAesKey,
    initialVectorBuffer,
  );
  decipher.setAuthTag(encrypted\_flow\_data\_tag);

  const decryptedJSONString \= Buffer.concat(\[
    decipher.update(encrypted\_flow\_data\_body),
    decipher.final(),
  \]).toString("utf-8");

  return {
    decryptedBody: JSON.parse(decryptedJSONString),
    aesKeyBuffer: decryptedAesKey,
    initialVectorBuffer,
  };
};

const encryptResponse \= (
  response: any,
  aesKeyBuffer: Buffer,
  initialVectorBuffer: Buffer,
) \=> {
  // Flip the initialization vector
  const flipped\_iv \= \[\];
  for (const pair of initialVectorBuffer.entries()) {
    flipped\_iv.push(~pair\[1\]);
  }
  // Encrypt the response data
  const cipher \= crypto.createCipheriv(
    "aes-128-gcm",
    aesKeyBuffer,
    Buffer.from(flipped\_iv),
  );
  return Buffer.concat(\[
    cipher.update(JSON.stringify(response), "utf-8"),
    cipher.final(),
    cipher.getAuthTag(),
  \]).toString("base64");
};

app.listen(PORT, () \=> {
  console.log(\`App is listening on port ${PORT}!\`);
});
```

### PHP Slim Example

Here's a full code sample to handle a request with decryption/encryption in PHP with Slim framework. Note that the response is sent as a plain text string.

```
<?php
use Psr\\Http\\Message\\ResponseInterface as Response;
use Psr\\Http\\Message\\ServerRequestInterface as Request;
use phpseclib3\\Crypt\\RSA;
use phpseclib3\\Crypt\\AES;

require \_\_DIR\_\_ . '/vendor/autoload.php';

$app \= Slim\\Factory\\AppFactory::create();
$app\->post('/data', function (Request $request, Response $response) {
    $body \= json\_decode($request\->getBody()->getContents(), true);

    $privatePem \= getenv('PRIVATE\_KEY');
    /\* 
    Example:
    \`\`\`-----BEGIN RSA PRIVATE KEY-----
    MIIE...
    ...
    ...AQAB
    -----END RSA PRIVATE KEY-----\`\`\`
    \*/
    $decryptedData \= decryptRequest($body, $privatePem);

    // Return the next screen & data to client
    $screen \= \[
        "screen" \=> "SCREEN\_NAME",
        "data" \=> \[
            "some\_key" \=> "some\_value"
        \]
    \];
    $resBody \= encryptResponse($screen, $decryptedData\['aesKeyBuffer'\], $decryptedData\['initialVectorBuffer'\]);
    // Return the response as plaintext
    $response\->getBody()->write($resBody);
    return $response;
});

function decryptRequest($body, $privatePem)
{
    $encryptedAesKey \= base64\_decode($body\['encrypted\_aes\_key'\]);
    $encryptedFlowData \= base64\_decode($body\['encrypted\_flow\_data'\]);
    $initialVector \= base64\_decode($body\['initial\_vector'\]);

    // Decrypt the AES key created by the client
    $rsa \= RSA::load($privatePem)
        \->withPadding(RSA::ENCRYPTION\_OAEP)
        \->withHash('sha256')
        \->withMGFHash('sha256');

    $decryptedAesKey \= $rsa\->decrypt($encryptedAesKey);
    if (!$decryptedAesKey) {
        throw new Exception('Decryption of AES key failed.');
    }

    // Decrypt the Flow data
    $aes \= new AES('gcm');
    $aes\->setKey($decryptedAesKey);
    $aes\->setNonce($initialVector);
    $tagLength \= 16;
    $encryptedFlowDataBody \= substr($encryptedFlowData, 0, \-$tagLength);
    $encryptedFlowDataTag \= substr($encryptedFlowData, \-$tagLength);
    $aes\->setTag($encryptedFlowDataTag);

    $decrypted \= $aes\->decrypt($encryptedFlowDataBody);
    if (!$decrypted) {
        throw new Exception('Decryption of flow data failed.');
    }

    return \[
        'decryptedBody' \=> json\_decode($decrypted, true),
        'aesKeyBuffer' \=> $decryptedAesKey,
        'initialVectorBuffer' \=> $initialVector,
    \];
}

function encryptResponse($response, $aesKeyBuffer, $initialVectorBuffer)
{
    // Flip the initialization vector
    $flipped\_iv \= ~$initialVectorBuffer;

    // Encrypt the response data
    $cipher \= openssl\_encrypt(json\_encode($response), 'aes-128-gcm', $aesKeyBuffer, OPENSSL\_RAW\_DATA, $flipped\_iv, $tag);
    return base64\_encode($cipher . $tag);
}

$app\->run();
```

### Java Example

Here's a full code sample to handle a request with decryption/encryption in Java 8+ using simple-json library:

Please note that this example requires private key to be in unencrypted PKCS8 format, which is normally indicated by 
```
-----BEGIN PRIVATE KEY-----
```
 at the beginning of the file.

Depending on the way and exact software which you used to generate private key, you may need to convert it to the required format first.

For example, if your key is in PKCS#1 format (starts with 
```
-----BEGIN RSA PRIVATE KEY-----
```
) or PKCS#8 encrypted format (starts with 
```
-----BEGIN ENCRYPTED PRIVATE KEY-----
```
), you can use below command to convert it to the unencrypted PKCS#8:

openssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt -in private.pem -out private\_unencrypted\_pkcs8.pem

```
package org.example;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.OAEPParameterSpec;
import javax.crypto.spec.PSource;
import javax.crypto.spec.SecretKeySpec;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.security.GeneralSecurityException;
import java.security.KeyFactory;
import java.security.interfaces.RSAPrivateKey;
import java.security.spec.MGF1ParameterSpec;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.Base64;

public class App {

    private static class DecryptionInfo {
        public final String clearPayload;
        public final byte\[\] clearAesKey;

        public DecryptionInfo(String clearPayload, byte\[\] clearAesKey) {
            this.clearPayload \= clearPayload;
            this.clearAesKey \= clearAesKey;
        }
    }

    private static final int AES\_KEY\_SIZE \= 128;
    private static final String KEY\_GENERATOR\_ALGORITHM \= "AES";
    private static final String AES\_CIPHER\_ALGORITHM \= "AES/GCM/NoPadding";
    private static final String RSA\_ENCRYPT\_ALGORITHM \= "RSA/ECB/OAEPWithSHA-256AndMGF1Padding";
    private static final String RSA\_MD\_NAME \= "SHA-256";
    private static final String RSA\_MGF \= "MGF1";

    public static void main(String\[\] args) throws Exception {
        HttpServer server \= HttpServer.create(new InetSocketAddress(3000), 0);
        server.createContext("/data", new EndpointHandler());
        server.setExecutor(null);
        server.start();
        System.out.print("Server started on " + server.getAddress());
    }

    static class EndpointHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange t) throws IOException {
            String response;
            int responseCode;
            try {
                final JSONParser parser \= new JSONParser();
                final JSONObject requestJson \= (JSONObject) parser.parse(new InputStreamReader(t.getRequestBody(), StandardCharsets.UTF\_8));
                final byte\[\] encrypted\_flow\_data \= Base64.getDecoder().decode((String) requestJson.get("encrypted\_flow\_data"));
                final byte\[\] encrypted\_aes\_key \= Base64.getDecoder().decode((String) requestJson.get("encrypted\_aes\_key"));
                final byte\[\] initial\_vector \= Base64.getDecoder().decode((String) requestJson.get("initial\_vector"));
                final DecryptionInfo decryptionInfo \= decryptRequestPayload(encrypted\_flow\_data, encrypted\_aes\_key, initial\_vector);
                final JSONObject clearRequestData \= (JSONObject) parser.parse(decryptionInfo.clearPayload);
                final String clearResponse \= String.format("{\\"screen\\":\\"SCREEN\_NAME\\",\\"data\\":{\\"some\_key\\":\\"some\_value\\"}}");
                response \= encryptAndEncodeResponse(clearResponse, decryptionInfo.clearAesKey, flipIv(initial\_vector));
                responseCode \= 200;
            } catch (Exception ex) {
                response \= "Processing error: " + ex.getMessage();
                responseCode \= 500;
            }
            t.getResponseHeaders().add("Content-Type", "text/plain; charset=UTF-8");
            final byte\[\] responseBytes \= response.getBytes();
            t.sendResponseHeaders(responseCode, responseBytes.length);
            OutputStream os \= t.getResponseBody();
            os.write(response.getBytes());
            os.close();
        }
    }

    private static DecryptionInfo decryptRequestPayload(byte\[\] encrypted\_flow\_data, byte\[\] encrypted\_aes\_key, byte\[\] initial\_vector) throws Exception {
        final RSAPrivateKey privateKey \= readPrivateKeyFromPkcs8UnencryptedPem(System.getenv("ENDPOINT\_PRIVATE\_KEY\_FILE\_PATH"));
        final byte\[\] aes\_key \= decryptUsingRSA(privateKey, encrypted\_aes\_key);
        return new DecryptionInfo(decryptUsingAES(encrypted\_flow\_data, aes\_key, initial\_vector), aes\_key);
    }

    private static String decryptUsingAES(final byte\[\] encrypted\_payload, final byte\[\] aes\_key, final byte\[\] iv) throws GeneralSecurityException {
        final GCMParameterSpec paramSpec \= new GCMParameterSpec(AES\_KEY\_SIZE, iv);
        final Cipher cipher \= Cipher.getInstance(AES\_CIPHER\_ALGORITHM);
        cipher.init(Cipher.DECRYPT\_MODE, new SecretKeySpec(aes\_key, KEY\_GENERATOR\_ALGORITHM), paramSpec);
        final byte\[\] data \= cipher.doFinal(encrypted\_payload);
        return new String(data, StandardCharsets.UTF\_8);
    }

    private static byte\[\] decryptUsingRSA(final RSAPrivateKey privateKey, final byte\[\] payload) throws GeneralSecurityException {
        final Cipher cipher \= Cipher.getInstance(RSA\_ENCRYPT\_ALGORITHM);
        cipher.init(Cipher.DECRYPT\_MODE, privateKey, new OAEPParameterSpec(RSA\_MD\_NAME, RSA\_MGF, MGF1ParameterSpec.SHA256, PSource.PSpecified.DEFAULT));
        return cipher.doFinal(payload);
    }
  
    private static RSAPrivateKey readPrivateKeyFromPkcs8UnencryptedPem(String filePath) throws Exception {
        final String prefix \= "-----BEGIN PRIVATE KEY-----";
        final String suffix \= "-----END PRIVATE KEY-----";
        String key \= new String(Files.readAllBytes(new File(filePath).toPath()), StandardCharsets.UTF\_8);
        if (!key.contains(prefix)) {
            throw new IllegalStateException("Expecting unencrypted private key in PKCS8 format starting with " + prefix);
        }
        String privateKeyPEM \= key.replace(prefix, "").replaceAll("\[\\\\r\\\\n\]", "").replace(suffix, "");
        byte\[\] encoded \= Base64.getDecoder().decode(privateKeyPEM);
        KeyFactory keyFactory \= KeyFactory.getInstance("RSA");
        PKCS8EncodedKeySpec keySpec \= new PKCS8EncodedKeySpec(encoded);
        return (RSAPrivateKey) keyFactory.generatePrivate(keySpec);
    }

    private static String encryptAndEncodeResponse(final String clearResponse, final byte\[\] aes\_key, final byte\[\] iv) throws GeneralSecurityException {
        final GCMParameterSpec paramSpec \= new GCMParameterSpec(AES\_KEY\_SIZE, iv);
        final Cipher cipher \= Cipher.getInstance(AES\_CIPHER\_ALGORITHM);
        cipher.init(Cipher.ENCRYPT\_MODE, new SecretKeySpec(aes\_key, KEY\_GENERATOR\_ALGORITHM), paramSpec);
        final byte\[\] encryptedData \= cipher.doFinal(clearResponse.getBytes(StandardCharsets.UTF\_8));
        return Base64.getEncoder().encodeToString(encryptedData);
    }

    private static byte\[\] flipIv(final byte\[\] iv) {
        final byte\[\] result \= new byte\[iv.length\];
        for (int i \= 0; i < iv.length; i++) {
            result\[i\] \= (byte) (iv\[i\] ^ 0xFF);
        }
        return result;
    }
}
```

### C# Example

Here's a full code sample to handle a request with decryption/encryption in C#. Note that the response is sent as a plain text string. [View the full project code on github.](https://l.facebook.com/l.php?u=https%3A%2F%2Fgithub.com%2FWhatsApp%2FWhatsApp-Flows-Tools%2Ftree%2Fmain%2Fexamples%2Fendpoint%2Fcsharp%2FFlowsEndpoint%3Ffbclid%3DIwZXh0bgNhZW0CMTEAYnJpZBExam5ydzFua3pNTUw3N2RJNnNydGMGYXBwX2lkATAAAR5j5oxAg2PFjIw-VbQEzGRlmUY5Ceb8Y7AsVL26Llb04CafRvMsCyFD1jZHWQ_aem_uN1b1oilFRzyYMYBUUp_1g&h=AT3sVpfpdQheghyn123lrgNOUtWZr4m-Jo7kUb-TO2tptumCLoPWgZLPcwhK7YNhZB6oXsBe36nuI5VKYpvJIg0D-jlDSQ19su3nTXPr1xRMwGksu46ldlWMQAV0QEp-A6eaXQ)

```
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Org.BouncyCastle.Crypto;
using Org.BouncyCastle.Crypto.Modes;
using Org.BouncyCastle.Crypto.Parameters;
using Org.BouncyCastle.Crypto.Engines;
using Org.BouncyCastle.OpenSsl;
using Org.BouncyCastle.Security;

var app \= WebApplication.CreateBuilder(args).Build();
var PRIVATE\_KEY \= Environment.GetEnvironmentVariable("PRIVATE\_KEY") ?? throw new InvalidOperationException("The environment variable 'PRIVATE\_KEY' is not set.");
var PASSPHRASE \= Environment.GetEnvironmentVariable("PASSPHRASE") ?? throw new InvalidOperationException("The environment variable 'PASSPHRASE' is not set.");

app.MapPost("/", (EndpointPayload body) \=>
{
    var decrypted \= EncryptionUtils.DecryptRequest(body.encrypted\_aes\_key, body.encrypted\_flow\_data, body.initial\_vector, PRIVATE\_KEY, PASSPHRASE);

    // Example to read decrypted fields
    var action \= decrypted.decryptedBody.GetProperty("action").GetString();

    // Return the next screen & data to client
    var response \= new { screen \= "SCREEN\_NAME", data \= new { some\_key \= "some\_value" } };
    var encryptedResponse \= EncryptionUtils.EncryptResponse(response, decrypted.aesKeyBytes, decrypted.initialVectorBytes);

    // Return the response as plaintext
    return Results.Content(encryptedResponse, "text/plain");

})
.WithName("PostEndpointData");

app.Run();

record EndpointPayload(string encrypted\_aes\_key, string encrypted\_flow\_data, string initial\_vector);

public class EncryptionUtils
{
    const int TAG\_LENGTH \= 16;

    public static (dynamic decryptedBody, byte\[\] aesKeyBytes, byte\[\] initialVectorBytes)
    DecryptRequest(string encryptedAesKey, string encryptedFlowData, string initialVector, string privatePem, string passphrase)
    {
        using (var rsa \= RSA.Create())
        {
            // Load the private key from PEM
            var pemReader \= new PemReader(new StringReader(privatePem), new PasswordFinder(passphrase));
            if (pemReader.ReadObject() is AsymmetricCipherKeyPair keyPair)
            {
                // Extract the private key parameters
                var privateKey \= keyPair.Private as RsaPrivateCrtKeyParameters;
                if (privateKey \== null)
                {
                    throw new CryptographicException("The provided PEM does not contain a valid RSA private key.");
                }

                // Convert Bouncy Castle RSA key parameters to .NET-compatible RSA parameters
                var rsaParams \= DotNetUtilities.ToRSAParameters(privateKey);
                // Import into .NET RSA
                rsa.ImportParameters(rsaParams);
            }
            else
            {
                throw new CryptographicException("The provided PEM is not a valid encrypted PKCS#1 RSA private key.");
            }

            // Decrypt the AES key created by the client
            byte\[\] encryptedAesKeyBytes \= Convert.FromBase64String(encryptedAesKey);
            byte\[\] aesKeyBytes \= rsa.Decrypt(encryptedAesKeyBytes, RSAEncryptionPadding.OaepSHA256);

            // Decrypt the Flow data
            byte\[\] initialVectorBytes \= Convert.FromBase64String(initialVector);
            byte\[\] flowDataBytes \= Convert.FromBase64String(encryptedFlowData);
            byte\[\] plainTextBytes \= new byte\[flowDataBytes.Length \- TAG\_LENGTH\];

            var cipher \= new GcmBlockCipher(new AesEngine());
            var parameters \= new AeadParameters(new KeyParameter(aesKeyBytes), TAG\_LENGTH \* 8, initialVectorBytes);
            cipher.Init(false, parameters);
            var offset \= cipher.ProcessBytes(flowDataBytes, 0, flowDataBytes.Length, plainTextBytes, 0);
            cipher.DoFinal(plainTextBytes, offset);

            string decryptedJsonString \= Encoding.UTF8.GetString(plainTextBytes);
            dynamic decryptedBody \= JsonSerializer.Deserialize<dynamic>(decryptedJsonString);
            return (decryptedBody: decryptedBody, aesKeyBytes: aesKeyBytes, initialVectorBytes: initialVectorBytes);
        }
    }

    public static string EncryptResponse(dynamic response, byte\[\] aesKeyBytes, byte\[\] initialVectorBytes)
    {
        // Flip the initialization vector
        byte\[\] flippedIV \= initialVectorBytes.Select(b \=> (byte)~b).ToArray();

        // Encrypt the response data
        string jsonResponse \= JsonSerializer.Serialize(response);
        byte\[\] dataToEncrypt \= Encoding.UTF8.GetBytes(jsonResponse);

        var cipher \= new GcmBlockCipher(new AesEngine());
        var cipherParameters \= new AeadParameters(new KeyParameter(aesKeyBytes), TAG\_LENGTH \* 8, flippedIV);

        // Encrypt the data
        cipher.Init(true, cipherParameters);
        byte\[\] encryptedDataBytes \= new byte\[cipher.GetOutputSize(dataToEncrypt.Length)\];
        var offset \= cipher.ProcessBytes(dataToEncrypt, 0, dataToEncrypt.Length, encryptedDataBytes, 0);
        cipher.DoFinal(encryptedDataBytes, offset);

        // Get the authentication tag
        byte\[\] authTag \= new byte\[TAG\_LENGTH\];
        Array.Copy(encryptedDataBytes, encryptedDataBytes.Length \- TAG\_LENGTH, authTag, 0, TAG\_LENGTH);

        // Concatenate encrypted data and auth tag, then return as base64
        byte\[\] encryptedResponse \= new byte\[encryptedDataBytes.Length \- TAG\_LENGTH + TAG\_LENGTH\];
        Array.Copy(encryptedDataBytes, 0, encryptedResponse, 0, encryptedDataBytes.Length \- TAG\_LENGTH);
        Array.Copy(authTag, 0, encryptedResponse, encryptedDataBytes.Length \- TAG\_LENGTH, TAG\_LENGTH);
        return Convert.ToBase64String(encryptedResponse);
    }
}

// Helper class for providing a password to the PemReader
public class PasswordFinder : IPasswordFinder
{
    private readonly char\[\] \_password;

    public PasswordFinder(string password)
    {
        \_password \= password.ToCharArray();
    }

    public char\[\] GetPassword()
    {
        return \_password;
    }
}
```

### Go Example

Here's a full code sample to handle a request with decryption/encryption in Go. Note that the response is sent as a plain text string.[View the full project code on github.](https://l.facebook.com/l.php?u=https%3A%2F%2Fgithub.com%2FWhatsApp%2FWhatsApp-Flows-Tools%2Ftree%2Fmain%2Fexamples%2Fendpoint%2Fgo%2Fflows-endpoint%3Ffbclid%3DIwZXh0bgNhZW0CMTEAYnJpZBExam5ydzFua3pNTUw3N2RJNnNydGMGYXBwX2lkATAAAR7WH7mGZ5pMtgZLO-XQY4KTpxZFQUuKdqIjVvfjm9Ho-LEz5qC2_FmY_kMk3g_aem_dv356yuCkJK2S9-uLT2bbQ&h=AT3udAP_kAaBTAe-HvNDlkfkMRqRJ6alcAQ_WfPxj-72fw6ZDoVDQQNDg3bsLTtunfNVjhCj20abHs0-mUE_NVK-G--5c6MBxunXlsAquHovPLV9WQL9c9CQgMOC6JceL3BSig)

```
package main

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"
	"log"
	"os"

	"github.com/gin-gonic/gin"
)

const nonceSize \= 16

type endpointPayload struct {
	EncryptedAESKey   string \`json:"encrypted\_aes\_key"\`
	EncryptedFlowData string \`json:"encrypted\_flow\_data"\`
	InitialVector     string \`json:"initial\_vector"\`
}

type decryptionResult struct {
	DecryptedBody      map\[string\]interface{}
	AESKeyBytes        \[\]byte
	InitialVectorBytes \[\]byte
}

func main() {
	privateKey := os.Getenv("PRIVATE\_KEY")
	passphrase := os.Getenv("PASSPHRASE")
	if privateKey \== "" || passphrase \== "" {
		log.Fatal("Environment variables 'PRIVATE\_KEY' and 'PASSPHRASE' are required.")
	}

	r := gin.Default()
	r.POST("/", func(c \*gin.Context) {
		encryptedResponse, err := processRequest(c, privateKey, passphrase)
		if err != nil {
			log.Print(err)
			c.String(500, "Internal Server Error")
			return
		}
		// Return encrypted response as plain text
		c.String(200, encryptedResponse)
	})
	r.Run(":3000")
}

func processRequest(c \*gin.Context, privateKey string, passphrase string) (string, error) {
	var payload endpointPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		return "", err
	}

	// Decrypt the request data
	decrypted, err := decryptRequest(payload.EncryptedAESKey, payload.EncryptedFlowData, payload.InitialVector, privateKey, passphrase)
	if err != nil {
		return "", err
	}

	// Access decrypted fields
	action, ok := decrypted.DecryptedBody\["action"\].(string)
	if ok {
		fmt.Printf("Action: %s\\n", action)
	}

	// Create a response object
	response := map\[string\]interface{}{
		"screen": "SCREEN\_NAME",
		"data":   map\[string\]string{"some\_key": "some\_value"},
	}

	// Encrypt the response
	encryptedResponse, err := encryptResponse(response, decrypted.AESKeyBytes, decrypted.InitialVectorBytes)
	if err != nil {
		return "", err
	}

	return encryptedResponse, nil
}

func decryptRequest(encryptedAESKey string, encryptedFlowData string, initialVector string, privatePem string, passphrase string) (decryptionResult, error) {
	// Parse the private key
	block, \_ := pem.Decode(\[\]byte(privatePem))
	if block \== nil || !x509.IsEncryptedPEMBlock(block) {
		return decryptionResult{}, errors.New("invalid PEM format or not encrypted")
	}

	decryptedKey, err := x509.DecryptPEMBlock(block, \[\]byte(passphrase))
	if err != nil {
		return decryptionResult{}, err
	}

	privateKey, err := x509.ParsePKCS1PrivateKey(decryptedKey)
	if err != nil {
		return decryptionResult{}, err
	}

	// Decrypt the AES key
	encryptedAESKeyBytes, \_ := base64.StdEncoding.DecodeString(encryptedAESKey)
	aesKeyBytes, err := rsa.DecryptOAEP(sha256.New(), rand.Reader, privateKey, encryptedAESKeyBytes, nil)
	if err != nil {
		return decryptionResult{}, err
	}

	// Decrypt the Flow data
	initialVectorBytes, \_ := base64.StdEncoding.DecodeString(initialVector)
	flowDataBytes, \_ := base64.StdEncoding.DecodeString(encryptedFlowData)

	blockCipher, err := aes.NewCipher(aesKeyBytes)
	if err != nil {
		return decryptionResult{}, err
	}

	gcm, err := cipher.NewGCMWithNonceSize(blockCipher, nonceSize)
	if err != nil {
		return decryptionResult{}, err
	}

	decryptedPlaintext, err := gcm.Open(nil, initialVectorBytes, flowDataBytes, nil)
	if err != nil {
		return decryptionResult{}, err
	}

	var decryptedBody map\[string\]interface{}
	if err := json.Unmarshal(decryptedPlaintext, &decryptedBody); err != nil {
		return decryptionResult{}, err
	}

	return decryptionResult{
		DecryptedBody:      decryptedBody,
		AESKeyBytes:        aesKeyBytes,
		InitialVectorBytes: initialVectorBytes,
	}, nil
}

func encryptResponse(response map\[string\]interface{}, aesKeyBytes, initialVectorBytes \[\]byte) (string, error) {
	// Flip the initialization vector
	flippedIV := make(\[\]byte, len(initialVectorBytes))
	for i, b := range initialVectorBytes {
		flippedIV\[i\] \= ^b
	}

	// Encrypt the response
	jsonResponse, err := json.Marshal(response)
	if err != nil {
		return "", err
	}

	blockCipher, err := aes.NewCipher(aesKeyBytes)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCMWithNonceSize(blockCipher, nonceSize)
	if err != nil {
		return "", err
	}

	encryptedData := gcm.Seal(nil, flippedIV, jsonResponse, nil)
	return base64.StdEncoding.EncodeToString(encryptedData), nil
}

```

### NodeJS Script Demonstrating AES Key Encryption and Decryption

This NodeJS code sample aims to give an approximate example of how 
```
encrypted_aes_key
```
 field is calculated and how it can be decrypted.

```
// demo encryption/decryption script
// put public key in public\_key.pem file in the same folder as this script
// put private key in private\_key.pem file in the same folder as this script
// run with: node <script-file-name>

import crypto from "crypto";
import fs from "fs";

const CLEAR\_AES\_KEY\_STR \= "<some-key-data>"
const PRIVATE\_KEY\_DATA \= fs.readFileSync('private\_key.pem', 'utf8');
const PUBLIC\_KEY\_DATA \= fs.readFileSync('public\_key.pem', 'utf8');

console.log("Clear key: " + CLEAR\_AES\_KEY\_STR)

const encryptedAesKey \= crypto.publicEncrypt(
  {
    key: PUBLIC\_KEY\_DATA,
    padding: crypto.constants.RSA\_PKCS1\_OAEP\_PADDING,
    oaepHash: "sha256"
  }
  ,
  Buffer.from(CLEAR\_AES\_KEY\_STR)
);

const encryptedAesKeyBase64 \= Buffer.from(encryptedAesKey).toString('base64');

console.log("Encrypted base64 key: " + encryptedAesKeyBase64)

const decryptedAesKey \= crypto.privateDecrypt(
  {
    key: crypto.createPrivateKey({
      key: PRIVATE\_KEY\_DATA,
      format: 'pem',
      type: 'pkcs1',//ignored if format is pem
      passphrase: '<passphrase>'
    }),
    padding: crypto.constants.RSA\_PKCS1\_OAEP\_PADDING,
    oaepHash: "sha256",
  },
  Buffer.from(encryptedAesKeyBase64, "base64"),
);

console.log("Decrypted key: " + decryptedAesKey)
if (decryptedAesKey.toString() \=== CLEAR\_AES\_KEY\_STR) {
  console.log("Success, keys match!")
} else {
  console.log("Failed, keys do not match!")
}

```