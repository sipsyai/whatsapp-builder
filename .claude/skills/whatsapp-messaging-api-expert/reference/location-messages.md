# Location messages

Updated: Nov 3, 2025

Location messages allow you to send a location's latitude and longitude coordinates to a WhatsApp user.

## Request syntax

Use the [POST /<WHATSAPP_BUSINESS_PHONE_NUMBER_ID>/messages](https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/message-api) endpoint to send a location message to a WhatsApp user.

```bash
curl 'https://graph.facebook.com/<API_VERSION>/<WHATSAPP_BUSINESS_PHONE_NUMBER_ID>/messages' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer <ACCESS_TOKEN>' \
-d '
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "<WHATSAPP_USER_PHONE_NUMBER>",
  "type": "location",
  "location": {
    "latitude": "<LOCATION_LATITUDE>",
    "longitude": "<LOCATION_LONGITUDE>",
    "name": "<LOCATION_NAME>",
    "address": "<LOCATION_ADDRESS>"
  }
}'
```

## Request parameters

| Placeholder | Description | Example Value |
|-------------|-------------|---------------|
| `<ACCESS_TOKEN>` *String* | **Required.** [System token](https://developers.facebook.com/documentation/business-messaging/whatsapp/access-tokens#system-user-access-tokens) or [business token](https://developers.facebook.com/documentation/business-messaging/whatsapp/access-tokens#business-integration-system-user-access-tokens). | `EAAAN6tcBzAUBOZC82CW7iR2LiaZBwUHS4Y7FDtQxRUPy1PHZClDGZBZCgWdrTisgMjpFKiZAi1FBBQNO2IqZBAzdZAA16lmUs0XgRcCf6z1LLxQCgLXDEpg80d41UZBt1FKJZCqJFcTYXJvSMeHLvOdZwFyZBrV9ZPHZASSqxDZBUZASyFdzjiy2A1sippEsF4DVV5W2IlkOSr2LrMLuYoNMYBy8xQczzOKDOMccqHEZD` |
| `<API_VERSION>` *String* | **Optional.** Graph API version. | v24.0 |
| `<LOCATION_ADDRESS>` *String* | **Optional.** Location address. | `101 Forest Ave, Palo Alto, CA 94301` |
| `<LOCATION_LATITUDE>` *String* | **Required.** Location latitude in decimal degrees. | `"37.44216251868683"` |
| `<LOCATION_LONGITUDE>` *String* | **Required.** Location longitude in decimal degrees. | `"-122.16153582049394"` |
| `<LOCATION_NAME>` *String* | **Optional.** Location name. | `Philz Coffee` |
| `<WHATSAPP_BUSINESS_PHONE_NUMBER_ID>` *String* | **Required.** WhatsApp business phone number ID. | `"106540352242922"` |
| `<WHATSAPP_USER_PHONE_NUMBER>` *String* | **Required.** WhatsApp user phone number. | `"+16505551234"` |

## Example request

Example request to send a location message with a name and address.

```bash
curl 'https://graph.facebook.com/v24.0/106540352242922/messages' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer EAAJB...' \
-d '
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "+16505551234",
  "type": "location",
  "location": {
    "latitude": "37.44216251868683",
    "longitude": "-122.16153582049394",
    "name": "Philz Coffee",
    "address": "101 Forest Ave, Palo Alto, CA 94301"
  }
}'
```

## Example response

```json
{
  "messaging_product": "whatsapp",
  "contacts": [
    {
      "input": "+16505551234",
      "wa_id": "16505551234"
    }
  ],
  "messages": [
    {
      "id": "wamid.HBgLMTY0NjcwNDM1OTUVAgARGBI1RjQyNUE3REYxMzAzMzQ5MkEA"
    }
  ]
}
```
