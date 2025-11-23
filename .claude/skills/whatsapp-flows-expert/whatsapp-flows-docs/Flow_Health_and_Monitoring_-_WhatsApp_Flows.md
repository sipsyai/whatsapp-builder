# Flow Health and Monitoring - WhatsApp Flows - Documentation - Meta for Developer

It is important to monitor your Flow's health and address any problems as they are discovered by WhatsApp. In order to do this, subscribe to and monitor the [flow webhooks](https://developers.facebook.com/docs/whatsapp/flows/reference/healthmonitoring/webhooks).

You will receive multiple alert webhooks before the Flow becomes **Throttled** or **Blocked**. See **Quality system overview** below for more information.

Flow health and monitoring is only applicable to Flows that use data from your endpoint.

## Quality system overview

WhatsApp monitors and sends alert webhooks related to the following metrics:

-   [Endpoint](https://developers.facebook.com/docs/whatsapp/flows/reference/healthmonitoring/webhooks#endpoint-error-rate-webhook) or [Client](https://developers.facebook.com/docs/whatsapp/flows/reference/flowswebhooks#clienter) error rate
-   [Endpoint latency](https://developers.facebook.com/docs/whatsapp/flows/reference/healthmonitoring/webhooks#endpoint-latency-webhook)
-   [Endpoint availability](https://developers.facebook.com/docs/whatsapp/flows/reference/healthmonitoring/webhooks#endpoint-availability-webhook)

If any of these metrics deteriorate significantly, WhatsApp may throttle or block your Flow.

 Flow state | Published | Throttled | Blocked |
| --- | --- | --- | --- |
 
**Restrictions**

 | 

No restrictions

 | 

Sending of the Flow restricted to 10 messages per hour.

 | 

Sending and opening of the Flow is blocked.

 |
 

**Impact**

 | 

No impact

 | 

Consumers will still be able to open previously received Flows and use them. However, the business will be limited to sending only 10 new Flow messages per hour.

 | 

Businesses will not be able to send any new Flow messages and consumers will not be able to open previously sent Flow messages.

 |

![](https://lookaside.fbsbx.com/elementpath/media/?media_id=323337403704473&version=1734106067)

When a Flow’s endpoint metrics begin deteriorating, the Flow status will first move to **Throttled**. Only if metrics deteriorate further is it moved to **Blocked**.

Once a Flow’s endpoint recovers, it will move first from **Blocked** to **Throttled**, and then from **Throttled** back to **Published**.

## How to get your Flow back to a Published state

1.  Review the [webhook alerts](https://developers.facebook.com/docs/whatsapp/flows/reference/healthmonitoring/webhooks) you have received for the Flow and check the contents of the alert.
    
2.  If you you have received:
    
      5.   **Latency alert**    -   Improve the responsiveness of your endpoint (aim to return a response in less than 1 second).
          
      7.   **Availability alert**    -   Ensure that your endpoint is available continuously, and is reachable from the internet.
              8.   Check that your endpoint can correctly respond to [health check ping requests](https://developers.facebook.com/docs/whatsapp/flows/reference/encryptedsecuredatachannel#h).
          
      10.   **Error rate alert**    -   Review the errors listed in the alert and check the [error codes reference guide](https://developers.facebook.com/docs/whatsapp/flows/reference/error-codes#webhookerrors) for possible resolutions.

Once you have fixed your endpoint, WhatsApp monitoring automatically detects the changes and the Flow’s state is updated.

## Publishing checks

 Check | Details | How to resolve |
| --- | --- | --- |
 
Is there a phone number connected to WhatsApp Business Account?

 | 

There needs to be verified phone number connected to WhatsApp Business Account.

 | 

You need to [add a phone number](https://developers.facebook.com/docs/whatsapp/cloud-api/phone-numbers) to your WhatsApp Business Account before you can send or publish a flow.

 |
 

Is a signed Flow's public key uploaded to a phone number?

 | 

User needs to upload signed Flow public key to a phone number

 | 

You need to [upload and sign a public key](https://developers.facebook.com/docs/whatsapp/flows/reference/implementingyourflowendpoint#upload-public-key) to a phone number before you can send or publish a Flow.

 |
 

Is data channel URI set?

 |  | 

You need to [set the data\_channel\_uri property](https://developers.facebook.com/docs/whatsapp/flows/reference/flowjson#top-level-flow-json-properties) before you can send or publish a Flow.

 |
 

Does the Flow have an application linked to it?

 |  | 

You need to [connect a Meta app](https://developers.facebook.com/docs/development/create-an-app) to the Flow before you can publish it.

 |
 

Does the Flow have a valid Flow JSON?

 |  | 

You need to verify that the Flow has a [valid Flow JSON](https://developers.facebook.com/docs/whatsapp/flows/reference/flowjson) before publishing.

 |
 

Are Flow JSON and Data API versions valid?

 | 

Versions could become [frozen or expired](https://developers.facebook.com/docs/whatsapp/flows/guides/versioning).

 | 

You need to verify that you’re using valid versions before you publish a new Flow. You can check the list of currently available versions in the [changelog](https://developers.facebook.com/docs/whatsapp/flows/changelogs).

 |
 

Is an endpoint available and responding to health check requests?

 |  | 

You need to verify that the endpoint is available and that you’ve implemented a [health check](https://developers.facebook.com/docs/whatsapp/flows/reference/implementingyourflowendpoint#health_check_request) before publishing.

 |
 

Is WhatsApp Business Account subscribed to the Flows webhooks?

 | 

Flow webhooks are the main way you can find out about production issues affecting your customers.

 | 

You need to verify that your WhatsApp Business account is subscribed to [Flows webhooks](https://developers.facebook.com/docs/whatsapp/flows/reference/healthmonitoring/webhooks#subscribe-to-webhooks).

 |