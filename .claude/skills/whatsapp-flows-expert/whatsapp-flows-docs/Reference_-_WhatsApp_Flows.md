# Reference - WhatsApp Flows - Documentation - Meta for Developer

Refer to this section to get more details on the Flows API, Flow JSON, and other technical topics for WhatsApp Flows.

<table class="uiGrid _51mz _57v1 _5f0n"><tbody><tr class="_51mx"><td class="_51m- vTop hLeft _57v2 _2cs2"><h3><a href="https://developers.facebook.com/docs/whatsapp/flows/reference/flowjson">Flow JSON</a></h3><p>Learn about Flow JSON.</p></td><td class="_51m- vTop hLeft _57v2 _2cs2 _51mw"><h3><a href="https://developers.facebook.com/docs/whatsapp/flows/reference/components">Flow JSON Components</a></h3><p>Flow JSON components.</p></td></tr><tr class="_51mx"><td class="_51m- vTop hLeft _57v2 _2cs2"><h3><a href="https://developers.facebook.com/docs/whatsapp/flows/reference/media_upload">Media Upload Components</a></h3><p>Media upload components.</p></td><td class="_51m- vTop hLeft _57v2 _2cs2 _51mw"><h3><a href="https://developers.facebook.com/docs/whatsapp/extensions/reference/extensionsapi">Flows API</a></h3><p>The Flows API provides a programmatic way to manage your Flows. This API allows you to create new Flows, publish draft Flows, and more.</p></td></tr><tr class="_51mx"><td class="_51m- vTop hLeft _57v2 _2cs2"><h3><a href="https://developers.facebook.com/docs/whatsapp/flows/reference/metrics_api">Metrics API</a></h3><p>Learn all about the Metrics API here.</p></td><td class="_51m- vTop hLeft _57v2 _2cs2 _51mw"><h3><a href="https://developers.facebook.com/docs/whatsapp/flows/reference/flowswebhooks">Webhooks</a></h3><p>It's important to keep an eye on the performance of your Flow.</p></td></tr><tr class="_51mx"><td class="_51m- vTop hLeft _57v2 _2cs2"><h3><a href="https://developers.facebook.com/docs/whatsapp/flows/reference/error-codes">Error Codes</a></h3><p>Are you seeing an error response from the Flows API? Learn more about the error and how to fix it here.</p></td><td class="_51m- vTop hLeft _57v2 _2cs2 _51mw"><h3><a href="https://developers.facebook.com/docs/whatsapp/flows/reference/versioning">Versioning</a></h3><p>Learn more about the different versions of Flow JSON and the Data API.</p></td></tr><tr class="_51mx"><td class="_51m- vTop hLeft _57v2 _2cs2"><h3><a href="https://developers.facebook.com/docs/whatsapp/flows/reference/lifecycle">Lifecycle of a Flow</a></h3><p>It's important to keep an eye on the performance of your Flow.</p></td><td class="_51m-"></td></tr></tbody></table>

## Learn More

-   Ready to create your first Flow? [Get Started here](https://developers.facebook.com/docs/whatsapp/flows/gettingstarted)!
-   Curious about what Flows look like? [Explore examples here](https://developers.facebook.com/docs/whatsapp/flows/examples).
-   Want to kick the tires with a demo Flow? [Try it now with the Flows Playground](https://developers.facebook.com/docs/whatsapp/flows/playground).
-   Looking for a comprehensive list of Flow Components? [Check it out here.](https://developers.facebook.com/docs/whatsapp/flows/reference/flowjson/components/)

## Supported Platforms

Currently, WhatsApp Flows are supported on:

-   Android running OS 6.0 and newer
-   iPhone running iOS 12 and newer

WhatsApp Flows are not supported on companion devices (e.g. WhatsApp Web).

## Terminology

**Flows**: Represents a use case or workflow that a business offers to users. For example, “Book an appointment”. A Flow consists of screens, components (such as input fields), assets such as graphics), and (optionally) an endpoint for data-driven interactions.

**Flow JSON**: Flow JSON is used to programmatically define Flows.

**Components**: Individual building blocks that make up a screen (text fields, buttons, and so on).

**Screens**: A collection of Components on a single screen, defined in Flow JSON.

**Endpoint**: Communication channel created to exchange data between WhatsApp screens and the business server that processes data from each screen. Based on the business logic, the channel is then used to respond back with data to render the next screen in the workflow.