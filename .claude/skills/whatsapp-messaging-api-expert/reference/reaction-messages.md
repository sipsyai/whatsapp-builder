# Reaction messages

**Updated: Nov 3, 2025**

Reaction messages are emoji-reactions that you can apply to a previous WhatsApp user message that you have received.

## Limitations

When sending a reaction message, only a sent message webhook (`status` set to `sent`) will be triggered; delivered and read message webhooks will not be triggered.

## Request syntax

Use the POST /<WHATSAPP_BUSINESS_PHONE_NUMBER_ID>/messages endpoint to apply an emoji reaction on a message you have received from a WhatsApp user.

```bash
curl 'https://graph.facebook.com/<API_VERSION>/<WHATSAPP_BUSINESS_PHONE_NUMBER_ID>/messages' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer <ACCESS_TOKEN>' \
-d '
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "<WHATSAPP_USER_PHONE_NUMBER>",
  "type": "reaction",
  "reaction": {
    "message_id": "<WHATSAPP_MESSAGE_ID>",
    "emoji": "<EMOJI>"
  }
}'
```

## Request parameters

| Placeholder | Description | Example Value |
|-------------|-------------|---------------|
| `<ACCESS_TOKEN>` String | Required. System token or business token. | `EAAAN6tcBzAUBOZC82CW7iR2LiaZBwUHS4Y7FDtQxRUPy1PHZClDGZBZCgWdrTisgMjpFKiZAi1FBBQNO2IqZBAzdZAA16lmUs0XgRcCf6z1LLxQCgLXDEpg80d41UZBt1FKJZCqJFcTYXJvSMeHLvOdZwFyZBrV9ZPHZASSqxDZBUZASyFdzjiy2A1sippEsF4DVV5W2IlkOSr2LrMLuYoNMYBy8xQczzOKDOMccqHEZD` |
| `<API_VERSION>` String | Optional. Graph API version. | `v24.0` |
| `<EMOJI>` String | Required. Unicode escape sequence of the emoji, or the emoji itself, to apply to the user message. | Unicode escape sequence example: `\uD83D\uDE00` Emoji example: 😀 |
| `<WHATSAPP_MESSAGE_ID>` String | Required. WhatsApp message ID of message you want to apply the emoji to. If the message you are reacting to is more than 30 days old, doesn't correspond to any message in the chat thread, has been deleted, or is itself a reaction message, the reaction message will not be delivered and you will receive a **messages** webhook with error code `"131009"`. | `wamid.HBgLMTY0NjcwNDM1OTUVAgASGBQzQUZCMTY0MDc2MUYwNzBDNTY5MAA=` |
| `<WHATSAPP_BUSINESS_PHONE_NUMBER_ID>` String | Required. WhatsApp business phone number ID. | `"106540352242922"` |
| `<WHATSAPP_USER_PHONE_NUMBER>` String | Required. WhatsApp user phone number. | `"+16505551234"` |

## Example request

Example request to apply the grinning face emoji (😀) to a previously received user message.

```bash
curl 'https://graph.facebook.com/v24.0/106540352242922/messages' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer EAAJB...' \
-d '
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "+16505551234",
  "type": "reaction",
  "reaction": {
    "message_id": "wamid.HBgLMTY0NjcwNDM1OTUVAgASGBQzQUZCMTY0MDc2MUYwNzBDNTY5MAA=",
    "emoji": "\uD83D\uDE00"
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
      "id": "wamid.HBgLMTY0NjcwNDM1OTUVAgARGBI1RjQyNUE3NEYxMzAzMzQ5MkEA"
    }
  ]
}
```
