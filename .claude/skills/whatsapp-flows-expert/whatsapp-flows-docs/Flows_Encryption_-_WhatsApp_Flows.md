# Flows Encryption - WhatsApp Flows - Documentation - Meta for Developer

This guide specifies how to set and get the business public key for the WhatsApp Flows user experience. Businesses will need to generate a 2048-bit RSA key pair and share a business public key to establish an encrypted GraphQL-powered data exchange channel between them and the WhatsApp consumer client.

## Prerequisites

The phone number must be [successfully registered](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/registration#register), and the business must have [generated a 2048-bit RSA Key](#gen) as described below.

### Generating a 2048-bit RSA Key Pair

Generate a public and private RSA key pair by typing in the following command:

```
openssl genrsa \-des3 \-out private.pem 2048
```

This generates 2048-bit RSA key pair encrypted with a password you provided and is written to a file.

Next, you need to export the RSA Public Key to a file:

```
openssl rsa \-in private.pem \-outform PEM \-pubout \-out public.pem
```

You can then use it, for example, on your web server to encrypt content such that it can only be read with the private key.

#### Reusing 2048-bit RSA Key Pairs Option

You could also re-use an existing private/public key pair by extracting a public key from existing certificate:

```
openssl x509 \-pubkey \-noout \-in private.pem  \> public.pem   
```

## Set Business Public Key

To set a business public key using Graph API, make a 
```
POST
```
 request to 
```
/PHONE_NUMBER_ID/whatsapp_business_encryption
```
. In your call, include the 2048-bit RSA key you generated. If you have multiple phone numbers linked to a WABA, this API must be called to sign the business public key for each phone number.

In [Postman](https://l.facebook.com/l.php?u=https%3A%2F%2Fwww.postman.com%2F%3Ffbclid%3DIwZXh0bgNhZW0CMTEAYnJpZBExam5ydzFua3pNTUw3N2RJNnNydGMGYXBwX2lkATAAAR7ffJW8Kiyp3ruhzoZko2G6rqiZ1fD_pz9RthdgYSppoZTDZE0NziI7MaZihg_aem_ZebGFv4b-6cjOMaLlIh7zA&h=AT3249Qu8v4Ku5_ARtzKX5TyuQwQXp8KV3f7oaUmEzsUawGL_U80R0oyTY5fHUv26xCMvBSjTBrjY4xKitLEGQYGvFf7RI42pDFcVvFpIDaDzGAsxh0WtLJwjHBQ2RC8YLqHOg), when inputting the business public key as a parameter in the **Body**, select **x-www-form-urlencoded.**

 Endpoint | Authentication |
| --- | --- |
 
```
/PHONE_NUMBER_ID/whatsapp_business_encryption
```


 | 

Authenticate yourself with a system user access token and you must have the 
```
whatsapp_business_messaging
```
 permission.

If you are requesting the code on behalf of another business, the access token needs to have Advanced Access to the 
```
whatsapp_business_messaging
```
 permission.

 |

### Parameters

 Name | Description |
| --- | --- |
 
```
business_public_key
```

_string_ | 

**Required.**

2048-bit RSA business public key generated.

 |

### Example

Sample request:

```
curl \-X POST \\
  'https://graph.facebook.com/v24.0/PHONE\_NUMBER\_ID/whatsapp\_business\_encryption' \\
  \-H 'Authorization: Bearer ACCESS\_TOKEN' \\
  \-H 'Content-Type: application/x-www-form-urlencoded' \\
  \--data\-urlencode 'business\_public\_key=BUSINESS\_PUBLIC\_KEY'
```

For example:

```
curl \-X POST \\
  'https://graph.facebook.com/v24.0/PHONE\_NUMBER\_ID/whatsapp\_business\_encryption' \\
  \-H 'Authorization: Bearer ACCESS\_TOKEN' \\
  \-H 'Content-Type: application/x-www-form-urlencoded' \\
  \--data\-urlencode 'business\_public\_key=-----BEGIN PUBLIC KEY-----
AAA
BBB
CCC
DDD
EEE
FFF
GGG
-----END PUBLIC KEY-----'
```

A successful request returns HTTP status code 
```
200
```
 and the payload:

```
{
  "success": true
}
```

Please see [Error and Status Messages](https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes) if you encounter any errors.

## Get Business Public Key

The phone number must be [successfully registered](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/registration#register), and the business must have [generated a 2048-bit RSA key](#gen).

To get a business public key using Graph API, make a 
```
GET
```
 request to 
```
/PHONE_NUMBER_ID/whatsapp_business_encryption
```
.

 Endpoint | Authentication |
| --- | --- |
 
```
/PHONE_NUMBER_ID/whatsapp_business_encryption
```


 | 

Authenticate yourself with a system user access token and you must have the 
```
whatsapp_business_messaging
```
 permission.

If you are requesting the code on behalf of another business, the access token needs to have Advanced Access to the 
```
whatsapp_business_messaging
```
 permission.

 |

### Parameters

 Name | Description |
| --- | --- |
 
```
business_public_key
```

_string_ | 

Stored 2048-bit RSA business public key.

 |
 

```
business_public_key_signature_status
```

_string_ | 

Status of stored 2048-bit RSA business public key.

 |

### Example

Sample request:

```
curl \-X GET \\
  'https://graph.facebook.com/v24.0/PHONE\_NUMBER\_ID/whatsapp\_business\_encryption' \\
  \-H 'Authorization: Bearer ACCESS\_TOKEN' 
```

A successful response looks like this:

```
{
  "business\_public\_key": "<2048\_bit\_RSA\_key>"
  "business\_public\_key\_signature\_status": VALID | MISMATCH
}
```

Please see [Error and Status Messages](https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes) if you encounter any errors.