# Receiving Flow Response - WhatsApp Flows - Documentation - Meta for Developer

Upon flow completion a response message will be sent to the WhatsApp chat. You will receive it in the same way as you receive all other messages from the user - via message webhook. 
```
response_json
```
 field will contain flow-specific data.

The structure of flow-specific data is controlled by Flow JSON or, in case you are using Endpoint for your flow, by final response payload from endpoint. See [Response Message Webhook](https://developers.facebook.com/docs/whatsapp/flows/reference/responsemsgwebhook) reference page for more details.

The Flow response does not include the Flow ID. You can include a custom field in your Flow payload or an identifier in the 
```
flow_token
```
 field to identify the corresponding Flow.

```
{
  "messages": \[{
    "context": {
      "from": "16315558151",
      "id": "gBGGEiRVVgBPAgm7FUgc73noXjo"
    },
    "from": "<USER\_ACCOUNT\_NUMBER>",
    "id": "<MESSAGE\_ID>",
    "type": "interactive",
    "interactive": {
      "type": "nfm\_reply",
      "nfm\_reply": {
        "name": "flow",
        "body": "Sent",
        "response\_json": "{\\"flow\_token\\": \\"<FLOW\_TOKEN>\\", \\"optional\_param1\\": \\"<value1>\\", \\"optional\_param2\\": \\"<value2>\\"}"
      }
    },
    "timestamp": "<MESSAGE\_SEND\_TIMESTAMP>"
  }\]
}
```