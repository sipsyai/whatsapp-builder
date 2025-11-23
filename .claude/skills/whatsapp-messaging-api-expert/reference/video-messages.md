# Video Messages

**Updated: Nov 3, 2025**

Video messages display a thumbnail preview of a video image with an optional caption. When the WhatsApp user taps the preview, it loads the video and displays it to the user.

## Sending Video Messages

Use the **POST /<WHATSAPP_BUSINESS_PHONE_NUMBER_ID>/messages** endpoint to send a video message to a WhatsApp user.

### Request Syntax

```
POST /<WHATSAPP_BUSINESS_PHONE_NUMBER_ID>/messages
```

### Post Body

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "{{wa-user-phone-number}}",
  "type": "video",
  "video": {
    "id" : "<MEDIA_ID>", /* Only if using uploaded media */
    "link": "<MEDIA_URL>", /* Only if linking to your media */
    "caption": "<VIDEO_CAPTION_TEXT>"
  }
}
```

### Post Body Parameters

| Placeholder | Description | Example Value |
|-------------|-------------|---------------|
| `<VIDEO_CAPTION_TEXT>` String | Optional. Video caption text. Maximum 1024 characters. | `A succulent eclipse!` |
| `<MEDIA_ID>` String | Required if using an uploaded media asset (recommended). Uploaded media asset ID. | `"1166846181421424"` |
| `<MEDIA_URL>` String | Required if linking to your media asset (not recommended) URL of video asset on your public server. For better performance, we recommend that you upload your media asset instead. | `https://www.luckyshrub.com/assets/lucky-shrub-eclipse-viewing.mp4` |
| `<WHATSAPP_USER_PHONE_NUMBER>` String | Required. WhatsApp user phone number. | `"+16505551234"` |

## Supported Video Formats

Only H.264 video codec and AAC audio codec supported. Single audio stream or no audio stream only.

| Video Type | Extension | MIME Type | Max Size |
|------------|-----------|-----------|----------|
| 3GPP | .3gp | video/3gpp | 16 MB |
| MP4 Video | .mp4 | video/mp4 | 16 MB |

## Example Request

Example request to send a video message with a caption to a WhatsApp user.

```bash
curl 'https://graph.facebook.com/v24.0/106540352242922/messages' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer EAAJB...' \
-d '{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "+16505551234",
  "type": "video",
  "video": {
    "id" : "1166846181421424",
    "caption": "A succulent eclipse!"
  }
}'
```

## Example Response

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
