# Share products with WhatsApp users

**Updated: Nov 6, 2025**

You have multiple ways to share products with your customers.

## Catalog messages

Catalog messages are messages that allow you to showcase your product catalog entirely within WhatsApp.

Catalog messages display a product thumbnail header image of your choice, custom body text, a fixed text header, a fixed text sub-header, and a **View catalog** button.

When a customer taps the **View catalog** button, your product catalog appears within WhatsApp.

### Requirements

You must have [inventory uploaded to Meta](https://developers.facebook.com/documentation/business-messaging/whatsapp/catalogs/sell-products-and-services/upload-inventory) in an ecommerce catalog [connected to your WhatsApp Business Account](https://www.facebook.com/business/help/158662536425974).

### Request syntax

Use the **WhatsApp Business Phone Number > Messages** endpoint to send a catalog message.

```
POST /<WHATSAPP_BUSINESS_PHONE_NUMBER_ID>/messages
```

### Post body

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "<TO>",
  "type": "interactive",
  "interactive" : {
    "type" : "catalog_message",
    "body" : {
      "text": "<BODY_TEXT>"
    },
    "action": {
      "name": "catalog_message",
      /* Parameters object is optional */
      "parameters": {
        "thumbnail_product_retailer_id": "<THUMBNAIL_PRODUCT_RETAILER_ID>"
      }
    },
    /* Footer object is optional */
    "footer": {
      "text": "<FOOTER_TEXT>"
    }
  }
}
```

### Properties

| Placeholder | Description | Sample Value |
|-------------|-------------|--------------|
| `<BODY_TEXT>` *String* | **Required.** Text to appear in the message body. Maximum 1024 characters. | `Hello! Thanks for your interest. Ordering is easy. Just visit our catalog and add items to purchase.` |
| `<FOOTER_TEXT>` *String* | **Optional.** Text to appear in the message footer. Maximum 60 characters. | `Best grocery deals on WhatsApp!` |
| `<THUMBNAIL_PRODUCT_RETAILER_ID>` *String* | **Optional.** Item SKU number. Labeled as **Content ID** in the Commerce Manager. The thumbnail of this item will be used as the message's header image. If the `parameters` object is omitted, the product image of the first item in your catalog will be used. | `2lc20305pt` |
| `<TO>` *String* | Customer phone number. | `"+16505551234"` |

### Example request

```bash
curl 'https://graph.facebook.com/v17.0/106540352242922/messages' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer EAAJB...' \
-d '
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "+16505551234",
  "type": "interactive",
  "interactive": {
    "type": "catalog_message",
    "body": {
      "text": "Hello! Thanks for your interest. Ordering is easy. Just visit our catalog and add items to purchase."
    },
    "action": {
      "name": "catalog_message",
      "parameters": {
        "thumbnail_product_retailer_id": "2lc20305pt"
      }
    },
    "footer": {
      "text": "Best grocery deals on WhatsApp!"
    }
  }
}'
```

### Example response

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
      "id": "wamid.HBgLMTY1MDM4Nzk0MzkVAgARGBI0ODVEREUwQzEzQkVBRjQ1RUUA"
    }
  ]
}
```

## Catalog template messages

Catalog template messages are template messages containing a button that, when tapped, displays your product catalog within WhatsApp.

See [Catalog Templates](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/marketing-templates/catalog-templates) to learn how to create and send these templates.

## Catalog Link messages

You can send a link to your entire product catalog by assembling a wa.me link and including it in a standard [text message](https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/send-messages#text-messages). When sending a text message, you can use the optional `preview_url` set to `"true"` to have the message render a set of product catalog thumbnails of any URL in the message `body` string.

Note that if you [disable the catalog](https://developers.facebook.com/documentation/business-messaging/whatsapp/catalogs/sell-products-and-services/set-commerce-settings#enable-disable-catalog), wa.me links and the **View Catalog** button in catalog link messages will display a **Invalid catalog link** message when tapped.

To assemble wa.me link, append your business phone number, including country code, to the end of the following string:

```
https://wa.me/c/
```

For example:

```
https://wa.me/c/15555455657
```

## Checkout button templates

Checkout button templates allow India-based businesses to showcase one or more products that WhatsApp users in India (with India country calling codes) can purchase, without having to leave the WhatsApp client.

See [Checkout Button Templates](https://developers.facebook.com/documentation/business-messaging/whatsapp/payments/payments-in/checkout-button-templates) to learn how to create and send these templates.

## Media card carousel templates

Media card carousel template messages allow you to send a single text message accompanied by a set of up to 10 cards in a horizontally scrollable view.

See [Media Card Carousel Templates](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/marketing-templates/media-card-carousel-templates) to learn how to create and send these templates.

## Multi-product message templates

Multi-Product Message (MPM) template messages present product information for up to 30 products from your ecommerce catalog, organized customizable by sections.

See [Multi-Product Message Templates](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/marketing-templates/mpm-templates) to learn how to create and send MPM templates.

## Product card carousel templates

Product card carousel template messages allow you to send a single text message accompanied by a set of up to 10 product cards in a horizontally scrollable view.

See [Product Card Carousel Templates](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/marketing-templates/product-card-carousel-templates) to learn how to create and send these templates.

## Product messages

Both Multi-Product Messages and Single-Product Messages are types of interactive messages.

### Overview

Customers that receive Multi- and Single-Product Messages can perform 3 main actions:

- **View products**: Customers can see a list of products or just one product. Whenever a customer clicks on a specific item, we fetch the product's latest info and display the product in a Product Detail Page (PDP) format. Currently, PDPs only support product images — any videos and/or GIFs added to the product won't be displayed in the PDP.

- **Add products to a cart**: Whenever a user adds a product to the shopping cart, we fetch the item's latest info. If there has been a state change on any of the items, we display a dialog saying "One or more items in your cart have been updated" — See [Product Updates](#product-updates) for more information. A cart persists in a chat thread between you and your customer until the cart is sent to you — See [Shopping Cart Experience](#shopping-cart-experience) for details.

- **Send a shopping cart to you**: After adding all needed items, customers can send their cart to you. After that, you can define the next steps, such as requesting delivery info or giving payment options.

If your customer has multiple devices linked to their account, the Multi-Product and Single-Product Messages will be synced between devices. However, the shopping cart is local to each specific device. See [Shopping Cart Experience](#shopping-cart-experience) for details.

Currently, these types of messages can be received in the following platforms:

- **iOS**: 2.21.100 (Multi-Product Messages) and 2.21.210 (Single-Product Messages).
- **Android**: 2.21.9.15 (Multi-Product Messages) and 2.21.19 (Single-Product Messages).
- **Web**: The web client that supports these features has been launched.

If the customer's app version does not support Multi- or Single-Product Messages, they will instead receive a message explaining that they were unable to receive a message because they are using an outdated version of WhatsApp. We will also send you a webhook notification indicating the message was unable to be delivered due to the customer using an outdated version of WhatsApp.

### Expected Behavior for Messages

Multi-Product Messages and Single-Product Messages can be:

- Forwarded by one user to another.
- Reopened by a user within the same chat thread.

Multi-Product Messages and Single-Product Messages cannot be:

- Sent as notifications. They can only be sent as part of existing chat threads.

### Limitations

Unlike product messages sent via the WhatsApp Business app, messages sent via the Cloud API currently do not display a shopping cart icon in the chat thread header.

### Product updates

You may need to update properties of items in your catalog. Depending on the updated property, this is how we handle any messages mentioning that product:

| Updated Property | Update Process |
|------------------|----------------|
| Product's price, title, description, and image. | <ul><li>You send a Multi or Single-Product Message containing product A.</li><li>You update product A's properties on their catalog.</li><li>The screens that display that product are updated as soon as the customer client learns about the change from the server.</li></ul> |
| Availability change | <ul><li>You send a customer a Multi- or Single-Product Message containing product B.</li><li>You sell all units of product B available. Then, you update your catalog saying that product B is no longer available</li><li>If a customer has already added product B to a cart, the item will be removed from the cart. The shopping cart displays a dialog saying "One or more items in your cart have been updated".</li><li>If a customer has not added product B to the cart, the Multi- or Single-Product Message now shows the item as unavailable.</li></ul> |

### Shopping cart experience

After viewing products, a customer can add them to their shopping cart and send that cart to you. For the purposes of commerce on WhatsApp, a shopping cart:

- **Is unique to a customer/business chat thread in a specific device**: Only one cart is created per chat thread between you and a customer, and carts do not persist across multiple devices. Once a cart is sent, the customer can open another cart with you and start the process again.

- **Has no expiration date**: The cart persists in the chat thread until it is sent to you. Once sent, the cart is cleared.

Customers can add up to 99 units of each single catalog item to a shopping cart, but there is no limit on the number of distinct items that can be added to a cart.

Once a cart has been sent, no edits can be made. Customers can send a new cart if they need new items, or would like to change their order. You cannot send carts to customers.

### Why you should use them

Both Multi- and Single-Product Messages lend themselves best to user experiences that are simple and personalized, where it's a better experience to guide the customer to a subset of items most relevant to them, rather than browsing your full inventory.

#### Simple and efficient

Combining the features with navigation tools like NLP, text search or List Messages and Reply Buttons to get to what the customer is looking for fast.

#### Personal

Populated dynamically so can be personalized to the customer or situation. For example, you can show a Multi-Product Message of a customer's most frequently ordered items.

#### Business outcomes

A performant channel for driving orders, during testing businesses had an average 7% conversion of Multi-Product Messages sent to carts received.

#### No templates

Interactive messages do not require templates or pre-approvals. They are generated in real-time and will always reflect the latest item details, pricing and stock levels from your inventory.

### Why you should use it

Multi-Product Messages are best for guiding customers to a specific subset of your inventory, such as:

- Shopping in a conversational way. For example, using search functionality to allow customers to type a shopping list and send back a Multi-Product Message in response.
- Navigating to a specific category. For example, fitness apparel.
- Personalized offers or recommendations.
- Re-ordering previously ordered items. For example, a user can re-order their regular take-out order of less than 30 items.

Single-Product Messages are best for guiding customers to one specific item from your inventory, offering quick responses from a limited set of options, such as:

- Responding to a customer's specific request.
- Providing a recommendation.
- Reordering a previous item.

Both features can also be used as part of a human agent flow, however you need to build the tooling to allow the human agent to generate a Multi-Product Message or Single-Product Message in thread.

### Sending product messages

Before sending product messages, follow the get started best suited for your needs:

- [Direct developers](https://developers.facebook.com/documentation/business-messaging/whatsapp/get-started)
- [Solution providers](https://developers.facebook.com/documentation/business-messaging/whatsapp/solution-providers/overview)

All API calls mentioned in this guide must be authenticated with an access token. Developers can authenticate their API calls with the access token generated in the **App Dashboard** > **WhatsApp** > **API Setup** panel. Solution Partners must authenticate themselves with an access token with the [whatsapp_business_messaging](https://developers.facebook.com/docs/permissions/reference/whatsapp_business_messaging) permission.

### Step 1: Assemble the interactive object

#### Single-Product Messages

To send a Single-Product Message, assemble an `interactive` object of type `product` with the following components:

| Required Components | Optional Components |
|---------------------|---------------------|
| <ul><li>Action Object — Must include both catalog_id and product_retailer_id.</li></ul> | <ul><li>Body Object</li><li>Footer Object</li></ul> |

See [Messages, Interactive Object](https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/message-api) for full information. By the end of the process, the interactive object should look something like this:

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "PHONE_NUMBER",
  "type": "interactive",
  "interactive": {
    "type": "product",
    "body": {
      "text": "BODY_TEXT"
    },
    "footer": {
      "text": "FOOTER_TEXT"
    },
    "action": {
      "catalog_id": "CATALOG_ID",
      "product_retailer_id": "ID_TEST_ITEM_1"
    }
  }
}
```

#### Multi-product messages

To send a Multi-Product Message, assemble an `interactive` object of type `product_list` with the following components:

| Required Components | Optional Components |
|---------------------|---------------------|
| <ul><li>Header Object — Header's type must be set to text. Remember to add a text object with the desired content.</li><li>Body Object</li><li>Action Object - Must include catalog_id and sections.<ul><li>Sections must be an array of objects describing each section using title and product_items.<ul><li>Each section's product_items value must be an array describing each product in the section using product_retailer_id and the product's SKU number.</li></ul></li></ul></li></ul> | <ul><li>Footer Object</li></ul> |

See [Messages, Interactive Object](https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/message-api) for full information. By the end of the process, the interactive object should look something like this:

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "PHONE_NUMBER",
  "type": "interactive",
  "interactive": {
    "type": "product_list",
    "header":{
      "type": "text",
      "text": "HEADER_CONTENT"
    },
    "body": {
      "text": "BODY_CONTENT"
    },
    "footer": {
      "text": "FOOTER_CONTENT"
    },
    "action": {
      "catalog_id": "CATALOG_ID",
      "sections": [
        {
          "title": "SECTION_TITLE",
          "product_items": [
            { "product_retailer_id": "PRODUCT-SKU" },
            { "product_retailer_id": "PRODUCT-SKU" },
            ...
          ]
        },
        {
          "title": "SECTION_TITLE",
          "product_items": [
            { "product_retailer_id": "PRODUCT-SKU" },
            { "product_retailer_id": "PRODUCT-SKU" },
            ...
          ]
        }
      ]
    }
  }
}
```

#### Missing items

If none of the items provided in the API calls above matches a product from your product catalog, an error message is sent and the Multi- or Single-Product Message is not sent to the user.

For Multi-Product Message, at least one item from the products list must match an item from your product catalog. In this case:

- Messages are sent successfully
- Items without a match are dropped
- You receive an error message asking for a catalog update

### Step 2: Add common message parameters

Once the interactive object is complete, append the other parameters that make a message: `recipient_type`, `to`, `messaging_product`, and `type`. Remember to set the `type` to `interactive`.

```bash
curl -X POST https://graph.facebook.com/v24.0/FROM_PHONE_NUMBER/messages \
-H 'Authorization: Bearer ACCESS_TOKEN' \
-d '{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "PHONE_NUMBER",
  "type": "interactive",
  "interactive": {
    // INTERACTIVE OBJECT GOES HERE
  }
}'
```

For all available parameters, see [Reference, Messages](https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/message-api).

### Step 3: Send a request to the messages endpoint

Send a POST request to the [`/PHONE_NUMBER_ID/messages`](https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/message-api) endpoint with the JSON object you have assembled in steps 1 and 2. If your message is sent successfully, you get the following response:

```json
{
  "messaging_product": "whatsapp",
  "contacts": [{
    "input": "PHONE_NUMBER",
    "wa_id": "WHATSAPP_ID",
  }]
  "messages": [{
    "id": "wamid.ID",
  }]
}
```

## Single-product message templates

Single-Product Message (SPM) template messages present a single product from your ecommerce catalog, accompanied by a product image, product title, and product price (all pulled from your product within your catalog), along with customizable body text, optional footer text, and an interactive **View** button.

See [Single-Product Message Templates](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/marketing-templates/spm-templates) to learn how to create and send SPM templates.
