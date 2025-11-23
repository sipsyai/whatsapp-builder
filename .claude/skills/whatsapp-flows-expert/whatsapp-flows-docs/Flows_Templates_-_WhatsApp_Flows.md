# Flows Templates - WhatsApp Flows - Documentation - Meta for Developer

## Sending a Flow

You can quickly build Whatsapp Flow in the [playground](https://developers.facebook.com/docs/whatsapp/flows/playground) and send it as as a [template message](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates), for example as part of a marketing campaign. Or you can create a [WhatsApp Flow](https://developers.facebook.com/docs/whatsapp/flows) and send it either as a [normal message](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages#flows-messages).

[Go here](https://developers.facebook.com/docs/whatsapp/conversation-types) to read more about message types, limits, and timing.

To send the Flow as a template, first you need to [create a template](https://developers.facebook.com/docs/graph-api/reference/whats-app-business-account/message_templates/#Creating). Here is an example request:

```
curl \-i \-X POST \\
https://graph.facebook.com/v16.0/<waba\-id\>/message\_templates \\
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
          "text": "Sign up",
          "flow\_action": "navigate",
          "navigate\_screen": "WELCOME\_SCREEN"
          "flow\_json" : "{    \\"version\\": \\"3.1\\",    \\"screens\\": \[        {            \\"id\\": \\"WELCOME\_SCREEN\\",            \\"layout\\": {                \\"type\\": \\"SingleColumnLayout\\",                \\"children\\": \[                    {                        \\"type\\": \\"TextHeading\\",                        \\"text\\": \\"Hello World\\"                    },                    {                        \\"type\\": \\"TextBody\\",                        \\"text\\": \\"Let\\'s start building things!\\"                    },                    {                        \\"type\\": \\"Footer\\",                        \\"label\\": \\"Complete\\",                        \\"on-click-action\\": {                            \\"name\\": \\"complete\\",                            \\"payload\\": {}                        }                    }                \]            },            \\"title\\": \\"Welcome\\",            \\"terminal\\": true,            \\"success\\": true,            \\"data\\": {}        }    \]}"
        }
      \]
    }
  \]
}'
```

 Property | Type | Description |
| --- | --- | --- |
 
```
buttons.flow_json
```


 | 

String

 | 

The Flow JSON encoded as string. Specifies the layout of the flow to be attached to the Template. The Flow JSON can be quickly generated in the [Flow playground](https://developers.facebook.com/docs/whatsapp/flows/playground). For full reference see [Flow JSON documentation](https://developers.facebook.com/docs/whatsapp/flows/reference/flowjson)

Cannot be used if the 
```
flow_id
```
 attribute is provided. Only one of the parameters is allowed.

 |
 

```
buttons.flow_id
```


 | 

String

 | 

```
id
```
 of a flow

Cannot be used if the 
```
flow_json
```
 attribute is provided. Only one of the parameters is allowed.

 |
 

```
buttons.navigate_screen
```


 | 

String

 | 

Flow JSON screen name. Required if flow\_action is 
```
navigate
```


 |
 

```
buttons.flow_action
```


 | 

Enum

 | 

```
navigate
```
 or 
```
data_exchange
```
. Default value is 
```
navigate
```


 |

See [here](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates/components#flows-buttons) for more details.

#### Sample Response

```
{
  "id": "<template-id>",
  "status": "PENDING",
  "category": "MARKETING"
}
```

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

Now you can send a template message with a flow using the following request:

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