# Sending a Flow - WhatsApp Flows - Documentation - Meta for Developer

## Send a Flow

On this page, we will explore the different ways of sending a Flow to users.

## Prerequisites

You will need to [verify your business](https://developers.facebook.com/docs/development/release/business-verification/) and maintain a [high message quality](https://developers.facebook.com/docs/whatsapp/messaging-limits#messaging-quality).

## Postman Collection

All the API requests mentioned below are documented in the [Flows API postman collection](https://l.facebook.com/l.php?u=https%3A%2F%2Fwww.postman.com%2Fmeta%2Fworkspace%2Fwhatsapp-business-platform%2Fdocumentation%2F24926895-7bf51205-92ed-49d1-af4a-0130cf84b6f6%3Ffbclid%3DIwZXh0bgNhZW0CMTEAYnJpZBExam5ydzFua3pNTUw3N2RJNnNydGMGYXBwX2lkATAAAR5rmmmvdGG3104uYBmBuitmAxc22SQf7cau0WPeaeADfpgAjvLyDjEwAMLfPw_aem_pw8RKxYbkp92dde7t7NjJw&h=AT2mNlqVDhtCaGPny180tLGIZH7kdXk6-nXJxfSSScCC_oopCovTuOvJ4LsWl3e8BEjrjSgNsKkQc5rMykhaE-WQG3sy7WRd_wApJ4r6DJYSQQ9Hk5UnmiHaCorcqtSGqsMuYQ) which you can use to make API requests and generate code in different languages.

## Business Initiated Messages

To send a business initiated message with a Flow, you can create and send a [message template](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates) with a WhatsApp Flow attached to it. We introduced a new button type called FLOW. Use this type to specify the Flow to be sent with the message template.

To send a Flow message template you need to:

1.  Create a message template with a Flow
2.  Send a message template with a Flow

### Create a message template with a Flow

You can quickly build a Flow in the [playground](https://developers.facebook.com/docs/whatsapp/flows/playground) and pass the Flow JSON in the message template creation request. Or you can specify the ID or name of an already published Flow.

Below is an example request to create a message template with a Flow, [see this page for full reference](https://developers.facebook.com/docs/graph-api/reference/whats-app-business-account/message_templates/#Creating):

#### Sample request

```
curl \-i \-X POST \\
https://graph.facebook.com/v16.0/<waba-id>/message\_templates \\
\-H 'Authorization: Bearer TOKEN' \\
\-H 'Content-Type: application/json' \\
\-d'
{
  "name": "example\_template\_name",
  "language": "en\_US",
  "category": "MARKETING",
  "components": \[
    {
      "type": "body",
      "text": "This is a flows as template demo"
    },
    {
      "type": "BUTTONS",
      "buttons": \[
        {
          "type": "FLOW",
          "text": "Open flow!",
          "flow\_id" : "<flow\_id>",
          // or
          "flow\_name" : "<flow\_name>",
          // or
          "flow\_json" : "{\\"version\\":\\"5.0\\",\\"screens\\":\[{\\"id\\":\\"WELCOME\_SCREEN\\",\\"layout\\":{\\"type\\":\\"SingleColumnLayout\\",\\"children\\":\[{\\"type\\":\\"TextHeading\\",\\"text\\":\\"Hello World\\"},{\\"type\\":\\"Footer\\",\\"label\\":\\"Complete\\",\\"on-click-action\\":{\\"name\\":\\"complete\\",\\"payload\\":{}}}\]},\\"title\\":\\"Welcome\\",\\"terminal\\":true,\\"success\\":true,\\"data\\":{}}\]}"
       }
      \]
    }
  \]
}'
```

 buttons object Parameters | Description |
| --- | --- |
 
```
type
```
 _string_

 | 

**Required.** Button type. Default value is 
```
FLOW
```


 |
 

```
text
```
 _string_

 | 

**Required.** Button label text. 25 characters maximum.

 |
 

```
flow_id
```
 _string_

 | 

**Required.** The unique ID of the Flow. Cannot be used if 
```
flow_name
```
 or 
```
flow_json
```
 parameters are provided. **Only one of these parameters is required.**

 |
 

```
flow_name
```
 _string_

 | 

**Required.** The name of the Flow. Supported in Cloud API only. The Flow ID is stored in the message template, not the name, so changing the Flow name will not affect existing message templates. Cannot be used if 
```
flow_id
```
 or 
```
flow_json
```
 parameters are provided. **Only one of these parameters is required.**

 |
 

```
flow_json
```
 _string_

 | 

**Required.** The Flow JSON encoded as string with escaping. The Flow JSON specifies the content of the Flow. Supported in Cloud API only. Cannot be used if 
```
flow_id
```
 or 
```
flow_name
```
 parameters are provided. **Only one of these parameters is required.**

 |
 

```
flow_action
```
 _string_

 | 

Default value is 
```
navigate
```
. Either 
```
navigate
```
 or 
```
data_exchange
```
.

 |
 

```
nagivate_screen
```
 _string_

 | 

The unique ID of the Screen in the Flow. Default value is 
```
FIRST_ENTRY_SCREEN
```
. Optional if 
```
flow_action
```
 is 
```
navigate
```
.

 |

Message templates can be created and sent in [these languages](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates/supported-languages).

#### Sample Response

```
{
  "id": "<template-id>",
  "status": "PENDING",
  "category": "MARKETING"
}
```

### Send template with Flow

Ensure that your template passes all required reviews so that 
```
status
```
 is 
```
APPROVED
```
 instead of 
```
PENDING
```
.

Now you can send a message template with a Flow using the request below

#### Sample request

```
curl \-X  POST \\
 'https://graph.facebook.com/v16.0/FROM\_PHONE\_NUMBER\_ID/messages' \\
 \-H 'Authorization: Bearer ACCESS\_TOKEN' \\
 \-H 'Content-Type: application/json' \\
 \-d '{
  "messaging\_product": "whatsapp",
  "recipient\_type": "individual",
  "to": "PHONE\_NUMBER",
  "type": "template",
  "template": {
    "name": "TEMPLATE\_NAME",
    "language": {
      "code": "LANGUAGE\_AND\_LOCALE\_CODE"
    },
    "components": \[
      {
        "type": "button",
        "sub\_type": "flow",
        "index": "0",
        "parameters": \[
          {
            "type": "action",
            "action": {
              "flow\_token": "FLOW\_TOKEN",   //optional, default is "unused"
              "flow\_action\_data": {
                 ...
              }   // optional, json object with the data payload for the first screen
            }
          }
        \]
      }
    \]
  }
}'
```

#### Sample Response

```
{
  "messaging\_product": "whatsapp",
  "contacts": \[
    {
      "input": "<phone-number>",
      "wa\_id": "<phone-number>"
    }
  \],
  "messages": \[
    {
      "id": "<message-id>"
    }
  \]
}
```

## User-Initiated Conversations

You are able to send your WhatsApp Flow once you have created it. You can send a Message with a Flow in a user-initiated conversation using a Message with a Call To Action (CTA). You send this message either through the On-Prem client or Cloud API with information specific to the Flow. The Flow is triggered when the user taps the CTA button.

[Go here](https://developers.facebook.com/docs/whatsapp/conversation-types) to read more about message types, limits, and timing.

As mentioned earlier, a message with a Flow is not much different from other types of messages. It uses the existing APIs, which are described on the following pages:

-   [Cloud API Interactive Messages](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages#interactive-object) documentation page describes how to send Interactive Messages with the Cloud API.
-   [On-Premises Interactive Object](https://developers.facebook.com/docs/whatsapp/on-premises/reference/messages/#interactive-object) documentation page describes sending messages with On-Premise client.

To send a message with a Flow, we have introduced a new type of the Interactive Object named 
```
flow
```
 with the following properties.

### Interactive message parameters for Cloud API

(See [On-Premises Interactive Object](https://developers.facebook.com/docs/whatsapp/on-premises/reference/messages/#interactive-object) documentation for On-Premise client parameters.)

 Parameter | Description |
| --- | --- |
 
```
interactive
```

object

 | The interactive message configuration |
 

↳
```
type
```

(required)

string

 | Value must be 
```
"flow"
```
. |
 

↳
```
action
```

(required)

object

 | 

 Parameter \| Description \|
\| --- \| --- \|
 
```
name
```

(required)

string

 \| Value must be 
```
"flow"
```
. \|
 

```
parameters
```

object

 \|  \|
 

↳
```
flow_message_version
```

(required)

string

 \| Value must be 
```
"3"
```
. \|
 

↳
```
flow_cta
```

(required)

string

 \| Text on the CTA button. For example: "Signup" CTA text length is advised to be 30 characters or less (no emoji). \|
 

↳
```
flow_id
```

(required)

string

 \| Unique ID of the Flow provided by WhatsApp.

Cannot be used with the 
```
flow_name
```
 parameter. **Only one of these parameters is required.**

 \|
 

↳
```
flow_name
```

(required)

string

 \| The name of the Flow that you created. Supported in Cloud API only. Changing the Flow name will require updating this parameter to match the new name.

Cannot be used with the 
```
flow_id
```
 parameter. **Only one of these parameters is required.**

 \|
 

↳
```
mode
```

string

 \| The Flow can be in either 
```
draft
```
 or 
```
published
```
 mode\*.

(Default value: 
```
published
```
)

 \|
 

↳
```
flow_token
```

string

 \| Flow token that is generated by the business to serve as an identifier.

(Default value: 
```
'unused'
```
)

 \|
 

↳
```
flow_action
```

string

 \| 
```
navigate
```
 or 
```
data_exchange
```
.

(Default value: 
```
navigate
```
)

 \|
 

↳
```
flow_action_payload
```

string

 \| Optional if 
```
flow_action
```
 is 
```
navigate
```
. Should be omitted otherwise.

 Parameter \\| Description \\|
\\| --- \\| --- \\|
 
```
screen
```

string

 \\| The ID of the screen displayed first. It needs to be an entry screen\*\*.

(Default value: 
```
FIRST_ENTRY_SCREEN
```
)

 \\|
 

```
data
```

object

 \\| Optional input data for the first Screen of the Flow. If provided, this must be a non-empty object.

(Default value: 
```
null
```
)

 \\|



 \|



 |

\*In case you edited published flow and now it is in the draft state, use "mode=draft" to send the current draft flow version, or "mode=published" (default value) to send the last published flow version.

\*\*See Flow JSON reference for [entry screen](https://developers.facebook.com/docs/whatsapp/flows/reference/flowjson#routing-rules) details.

**Cloud API Sample Request (with minimum parameters)**

```
curl \-X  POST \\
 'https://graph.facebook.com/v18.0/FROM\_PHONE\_NUMBER/messages' \\
 \-H 'Authorization: Bearer ACCESS\_TOKEN' \\
 \-H 'Content-Type: application/json' \\
 \-d '{
  "recipient\_type": "individual",
  "messaging\_product": "whatsapp",
  "to": "whatsapp-id",
  "type": "interactive",
  "interactive": {
    "type": "flow",
    "header": {
      "type": "text",
      "text": "Flow message header"
    },
    "body": {
      "text": "Flow message body"
    },
    "footer": {
      "text": "Flow message footer"
    },
    "action": {
      "name": "flow",
      "parameters": {
        "flow\_message\_version": "3",
        "flow\_name": "appointment\_booking\_v1", //or flow\_id
        "flow\_cta": "Book!"
      }
    }
  }
}'
```

**Cloud API Sample Request (with all parameters)**

```
curl \-X  POST \\
 'https://graph.facebook.com/v18.0/FROM\_PHONE\_NUMBER/messages' \\
 \-H 'Authorization: Bearer ACCESS\_TOKEN' \\
 \-H 'Content-Type: application/json' \\
 \-d '{
  "recipient\_type": "individual",
  "messaging\_product": "whatsapp",
  "to": "whatsapp-id",
  "type": "interactive",
  "interactive": {
    "type": "flow",
    "header": {
      "type": "text",
      "text": "Flow message header"
    },
    "body": {
      "text": "Flow message body"
    },
    "footer": {
      "text": "Flow message footer"
    },
    "action": {
      "name": "flow",
      "parameters": {
        "flow\_message\_version": "3",
        "flow\_token": "AQAAAAACS5FpgQ\_cAAAAAD0QI3s.",

        "flow\_name": "appointment\_booking\_v1",
        //or
        "flow\_id": "123456",

        "flow\_cta": "Book!",
        "flow\_action": "navigate",
        "flow\_action\_payload": {
          "screen": "<SCREEN\_NAME>",
          "data": { 
            "product\_name": "name",
            "product\_description": "description",
            "product\_price": 100
          }
        }
      }
    }
  }
}'
```

**Sample Response**

```
{
  "contacts": \[
    {
      "Input": "+447385946746",
      "wa\_id": "47385946746"
    }
  \],
  "messages": \[
    {
      "id": "gHTRETHRTHTRTH-av4Y"
    }
  \],
  "meta": {
    "api\_status": "stable",
    "version": "2.44.0.27"
  }
}
```