# Components - WhatsApp Flows - Documentation - Meta for Developers
Components are like building blocks. They allow you to build complex UIs and display business data using attribute models. **The maximum number of components per screen is 50.** Please refer to [best practices for components](https://developers.facebook.com/docs/whatsapp/extensions/bestpractices#number-of-components).

The following components are supported:

*   [Basic Text (Heading, Subheading, Caption, Body)](#text)
    
*   [RichText](#richtext)
    
*   [TextEntry](#textentry)
    
*   [CheckboxGroup](#checkbox)
    
*   [RadioButtonsGroup](#radio)
    
*   [Footer](#foot)
    
*   [OptIn](#opt)
    
*   [Dropdown](#drop)
    
*   [EmbeddedLink](#embed)
    
*   [DatePicker](#dp)
    

*   [CalendarPicker](#calendarpicker)

*   [Image](#img)
    
*   [If](#if)
    
*   [Switch](#switch)
    
*   [Media upload](#media_upload)
    

*   [NavigationList](#navlist)

*   [Chips Selector](#chips_selector)

*   [Image Carousel](#image_carousel)

Text Components
---------------

### Heading

This is the top level title of a page.


|Parameter             |Description                                                     |
|----------------------|----------------------------------------------------------------|
|type (required) string|        "TextHeading"                                           |
|text (required) string|        Dynamic "${data.text}"                                  |
|visibleBoolean        |        Dynamic "${data.is_visible}"         Default: True      |


### Subheading


|Parameter             |Description                                                     |
|----------------------|----------------------------------------------------------------|
|type (required) string|        "TextSubheading"                                        |
|text (required) string|        Dynamic "${data.text}"                                  |
|visibleBoolean        |        Dynamic "${data.is_visible}"         Default: True      |


### Body



* Parameter: type (required) string
  * Description:         TextBody      
* Parameter: text (required) string
  * Description:         Dynamic "${data.text}"      
* Parameter: font-weightenum
  * Description:         {'bold','italic','bold_italic','normal'}         Dynamic "${data.font_weight}"      
* Parameter: strikethroughBoolean
  * Description:         Dynamic "${data.strikethrough}"      
* Parameter: visibleBoolean
  * Description:         Dynamic "${data.is_visible}"          Default: True      
* Parameter: markdownBoolean
  * Description:         Default: False        Requires Flow JSON V5.1+


### Caption



* Parameter: type (required) string
  * Description:         "TextCaption"      
* Parameter: text (required) string
  * Description:         Dynamic "${data.text}"      
* Parameter: font-weightenum
  * Description:         {'bold','italic','bold_italic','normal'}         Dynamic "${data.font_weight}"      
* Parameter: strikethroughBoolean
  * Description:         Dynamic "${data.strikethrough}"      
* Parameter: visibleBoolean
  * Description:         Dynamic "${data.is_visible}"          Default: True      
* Parameter: markdownBoolean
  * Description:         Default: False        Requires Flow JSON V5.1+


### Limits and Restrictions


|Component                   |Type           |Limit / Restriction                 |
|----------------------------|---------------|------------------------------------|
|HeadingSubheadingBodyCaption|Character Limit|80804096409                         |
|HeadingSubheadingBodyCaption|Text           |Empty or Blank value is not accepted|


### Additional capabilities for Text components

Supported starting with Flow JSON version 5.1

In Flow JSON V5.1 `TextBody` and `TextCaption` also supports a limited markdown syntax. In order to enable this capability, set the property `markdown=true`; this will instruct Whatsapp Flows to enable markdown syntax within these components.

```
{
   "type": "TextBody",
   "markdown": true,
   "text": [
     "This text is ~~***really important***~~",
   ]
}
```


```
{
   "type": "TextCaption",
   "markdown": true,
   "text": [
     "This text is ~~***really important***~~",
   ]
}
```


For comparison purposes, we show how the text components look like next to one another:

  

Rich Text
---------

Supported starting with Flow JSON version 5.1

Flow JSON 5.1 introduces a new component - `RichText`. The goal of the component is to provide a rich formatting capabilities and introduce the way to render large texts (**Terms of Condition**, **Policy Documents**, **User Agreement** and etc) without facing limitations of basic text components (**TextHeading**, **TextSubheading**, **TextBody** and etc)



* Parameter: type (required) string
  * Description:         "RichText"      
* Parameter: text (required) string | string array
  * Description:         Dynamic "${data.text}"      
* Parameter: visibleBoolean
  * Description:         Dynamic "${data.is_visible}"         Default: True      


`RichText` component utilizes a select subset of the `Markdown` specification. It adheres strictly to standard `Markdown` syntax without introducing any custom modifications. Content created for the `RichText` component is fully compatible with standard `Markdown` documents.

**Note:**

Until V6.2, the RichText component can only be used as a standalone component on the screen and cannot be combined with other components on the same screen.

Starting with V6.3, the RichText component can be used in conjunction with the Footer component on same screen, allowing the Flow to navigate from or end at the screen with RichText.

If your use case requires to incorporate text with other components, consider using the basic Text component, which supports markdown features such as bold, italic, strikethrough, links and lists.

### Supported Syntax

#### Headings

The current syntax supports only `Heading (h1)` and `Subheading (h2)`. Other heading levels will be parsed but rendered as normal text - `TextBody`.


|        Flow JSON                                     |        Flow Component      |
|------------------------------------------------------|----------------------------|
|urltomarkdowncodeblockplaceholder20.7609694587733249  |TextHeading                 |
|urltomarkdowncodeblockplaceholder30.7470541247395521  |TextSubheading              |
|urltomarkdowncodeblockplaceholder40.013647496027805905|TextBody                    |


#### Paragraphs

To create paragraphs, split your text into different array items:

```
{
       "type": "RichText",
       "text": [
         "Paragraph 1",
        "Paragraph 2",
       ]
    }
```


or add a blank line in your markdown document that you bind using dynamic binding syntax `${data.your_dynamic_field}`

```
# Heading 1    
Paragraph 1
  
Paragraph 2

```


```
{
       "type": "RichText",
       "text": "${data.text}"
    }
```


#### Text Formatting


|        Flow JSON                                    |        Flow Component              |
|-----------------------------------------------------|------------------------------------|
|urltomarkdowncodeblockplaceholder80.9264814894497113 |TextBody (bold)                     |
|urltomarkdowncodeblockplaceholder90.7719875072920106 |TextBody (italic)                   |
|urltomarkdowncodeblockplaceholder100.1022893426173479|TextBody (strikethrough)            |
|urltomarkdowncodeblockplaceholder110.6938853776906364|TextBody (bold-italic-strikethrough)|


#### Lists

You can organize items into ordered and unordered lists. At the moment, only single level lists are supported.



*         Flow JSON      : urltomarkdowncodeblockplaceholder120.26599430273515545
  *         Flow Component      : OrderedList (not available as standalone component)
*         Flow JSON      : urltomarkdowncodeblockplaceholder130.6720307290961889urltomarkdowncodeblockplaceholder140.19673345718079083
  *         Flow Component      : UnorderedList (not available as standalone component)


#### Images

You can also include images in the content. Please note, external URIs are not supported and you can only include base64 inline images

```
{
   "type": "RichText",
   "text": ["![Image alt text](data:image/png;base64,<base64 content>)"]
}
```


**Recommended image formats:**

1.  png
2.  jpg / jpeg
3.  webp (please note, webp is only supported starting from IOS 14.6+, that corresponds to ~98% of IOS devices)

#### Links

To create a link, enclose the link text in brackets and then follow it immediately with the URL in parentheses

```
{
   "type": "RichText",
   "text": ["[Whatsapp Flows are awesome](https://business.whatsapp.com/products/whatsapp-flows)",
   ]
}
```


#### Tables

To add a table, use three or more hyphens (---) to create each column’s header, and use pipes (|) to separate each column. For compatibility, you should also add a pipe on either end of the row.

Cell content can be combined with the following syntax:

1.  Italic, bold, strikethrough
2.  Images
3.  Links

```
{
   "type": "RichText",
   "text": [
     "| Column Header 1     | Column Header 2                                             |",
     "| -------------       |  -------------                                              |",
     "| **Bold** text 1     | [Link](<URI>)                                               |",
     "| **Bold** text 1     | ![Image alt text](data:image/png;base64,<base64 content>)   |",
   ]
}
```


**Width of the columns:**

Width of the column is based on the Header content size. Markdown specification doesn’t provide a specific syntax for controlling a column width. If you want to make a certain column wider, simply add additional content to the header:

```
{
   "type": "RichText",
   "text": [
     "| Column Header 1 - Extended width  | Column Header 2       |",
     "| -------------                     |  -------------        |",
     "| **Bold** text 1                   | Cell text 2           |",
   ]
}
```


#### Working with large texts

If your text content for markdown has a limited size, you can incorporate it as a static text as shown in all examples above, however if your text is large and you expect to update it often on your server, we recommend sending it as a part of dynamic data, this will improve overall readability of the JSON and allow to load always up to date text from your server.

**Please note:** We use array text property for static cases since it’s easier to read. However the components support both types: `Array of strings` and `string`. Your markdown can be sent as a normal string, you don’t need to convert it to an array of strings.

#### Syntax cheatsheet

*   Supported starting with Flow JSON version 5.1

Here is the quick overview of the syntax that’s supported by RichText, TextBody and TextCaption components


|Syntax                                                |RichText|TextBody|TextCaption|
|------------------------------------------------------|--------|--------|-----------|
|# Text Heading                                        |✅       |❌       |❌          |
|## Text Subheading                                    |✅       |❌       |❌          |
|**bold**                                              |✅       |✅       |✅          |
|*italic*                                              |✅       |✅       |✅          |
|~~strikethrough~~                                     |✅       |✅       |✅          |
|Normal Paragraph                                      |✅       |✅       |✅          |
|urltomarkdowncodeblockplaceholder190.5699918629003782 |✅       |✅       |✅          |
|urltomarkdowncodeblockplaceholder200.03239774656653416|✅       |✅       |✅          |
|[Link text](https://your-url.here)                    |✅       |✅       |✅          |
|![Image Alt](data:image/png;base64, base64-data)      |✅       |❌       |❌          |
|urltomarkdowncodeblockplaceholder210.4839827875981402 |✅       |❌       |❌          |


#### Usage example

Text Entry Components
---------------------

### TextInput



* Parameter: type (required) string
  * Description:         "TextInput"      
* Parameter: label (required) string
  * Description:         Dynamic "${data.label}"      
* Parameter: label-variantstring
  * Description:         	"large"                    Label will have a more prominent style and will be displayed across multiple lines if needed.               					Supported starting with Flow JSON version 7.0
* Parameter: input-typeenum
  * Description:         {'text','number','email', 'password', 'passcode', 'phone'}      
* Parameter: patternString
  * Description:              When specified, it is a regular expression which the input's value must match for the value to pass.                  Supported starting with Flow JSON version 6.2Supported with input-type= {'text', 'number', 'password', 'passcode'} Expects a raw regex string (e.g., hello, not /hello/).  When using the pattern field, helper-text is mandatory. For input-type= {'number', 'passcode' }, a base regular expression is applied before the pattern validator, ensuring both validations are performed.
* Parameter: requiredBoolean
  * Description:         Dynamic "${data.is_required}"      
* Parameter: min-charsString
  * Description:         Dynamic "${data.min_chars}"      
* Parameter: max-charsString
  * Description:         Dynamic "${data.max_chars}".  Default value is 80 characters.      
* Parameter: helper-textString
  * Description:         Dynamic "${data.helper_text}"      
* Parameter: name (required) String
  * Description: 
* Parameter: visibleBoolean
  * Description:         Dynamic "${data.is_visible}"          Default: True      
* Parameter: init-valueString
  * Description:         Dynamic "${data.init-value}"          Only available when component is outside Form component          Optional FormSupported starting with Flow JSON version 4.0
* Parameter: error-messageString
  * Description:         Dynamic "${data.error-message}"          Only available when component is outside Form component          Optional FormSupported starting with Flow JSON version 4.0


### TextArea



* Parameter: type (required) string
  * Description:         "TextArea"      
* Parameter: label (required) string
  * Description:         Dynamic "${data.label}"      
* Parameter: label-variantstring
  * Description:         	"large"                                        Label will have a more prominent style and will be displayed across multiple lines if needed.               					Supported starting with Flow JSON version 7.0
* Parameter: requiredBoolean
  * Description:         Dynamic "${data.is_required}"      
* Parameter: max-lengthString
  * Description:         Dynamic "${data.max_length}"   Default value is 600 characters.      
* Parameter: name (required) String
  * Description: 
* Parameter: helper-textString
  * Description:         Dynamic "${data.helper_text}"      
* Parameter: enabledBoolean
  * Description:         Dynamic "${data.is_enabled}"      
* Parameter: visibleBoolean
  * Description:         Dynamic "${data.is_visible}"          Default: True      
* Parameter: init-valueString
  * Description:         Dynamic "${data.init-value}"          Only available when component is outside Form component          Optional FormSupported starting with Flow JSON version 4.0
* Parameter: error-messageString
  * Description:         Dynamic "${data.error-message}"          Only available when component is outside Form component          Optional FormSupported starting with Flow JSON version 4.0


### Limits and Restrictions


|        Component      |       Type               |       Limit / Restriction             |
|-----------------------|--------------------------|---------------------------------------|
|TextInput              |Helper TextError TextLabel|80 characters30 characters20 characters|
|TextArea               |Helper TextLabel          |80 characters20 characters             |


Together, the text entry components look like as shown:

CheckboxGroup
-------------

CheckboxGroup component allows users to pick multiple selections from a list of options.



* Parameter: type (required) string
  * Description:         "CheckboxGroup"      
* Parameter: data-source (required) Array
  * Description:         Dynamic "${data.data_source}"        Flow JSON versions before 5.0: Array< id: String, title: String, description: String, metadata: String, enabled: Boolean>Flow JSON versions after 5.0: Array< id: String, title: String, description: String, metadata: String, enabled: Boolean, image: Base64 of an image, alt-text: string, color: 6-digit hex color string >Flow JSON versions after 6.0: Array< id: String, title: String, description: String, metadata: String, enabled: Boolean, image: Base64 of an image, alt-text: string, color: 6-digit hex color string, on-select-action: {name: 'update_data', payload: {...}}, on-unselect-action: {name: 'update_data', payload: {...}} >
* Parameter: name (required) String
  * Description: 
* Parameter: min-selected-itemsInteger
  * Description:         Dynamic "${data.min_selected_items}"      
* Parameter: max-selected-itemsInteger
  * Description:         Dynamic "${data.max_selected_items}"      
* Parameter: enabledBoolean
  * Description:         Dynamic "${data.is_enabled}"      
* Parameter: labelstring
  * Description:         Dynamic "${data.label}"           Flow JSON versions before 4.0: optionalFlow JSON versions after 4.0: required
* Parameter: requiredBoolean
  * Description:         Dynamic "${data.is_required}"      
* Parameter: visibleBoolean
  * Description:         Dynamic "${data.is_visible}"          Default: True      
* Parameter: on-select-actionAction
  * Description: data_exchange and update_data are supported.update_dataSupported starting with Flow JSON version 6.0
* Parameter: on-unselect-actionAction
  * Description:                             Only `update_data` is supported.               Supported starting with Flow JSON version 6.0In V6.0, if `on-unselect-action` is not added, `on-select-action` will continue to handle both selection and unselection events. However, if `on-unselect-action` is defined, it will exclusively handle unselection, while `on-select-action` will be used solely for selection.
* Parameter: descriptionString
  * Description:         	Dynamic "${data.description}"          Supported starting with Flow JSON version 4.0
* Parameter: init-valueArray<String>
  * Description:         Dynamic "${data.init-value}"          Only available when component is outside Form component          Supported starting with Flow JSON version 4.0
* Parameter: error-messageString
  * Description:         Dynamic "${data.error-message}"          Only available when component is outside Form component          Supported starting with Flow JSON version 4.0
* Parameter: media-sizeenum
  * Description:         {'regular', 'large'}        Dynamic "${data.media-size}"        Supported starting with Flow JSON version 5.0


Images in WEBP format are not supported on iOS versions prior to iOS 14.

### Example

For the `data-source` field, you can declare it dynamically or statically.

### Static Example

This static example hardcodes the respective `id`'s and `title`'s for the `data-source` field.

#### Dynamic Example

In this dynamic example, you can see that `data-source` references the `days_per_week_options` of type `array` defined before it using `days_per_week_options`. When defining such a structure, you need to specify `items` in the `array`, which will be of type `object`. Then inside the `items` object, you have a `properties` dictionary with `id` and `title` just like in the static declaration. Both `id` and `title` will always be of type `String`. Within the `days_per_week_options` array, you must define concrete examples in the `__example__` field.

### Limits and Restrictions



*        Type      : Label ContentTitleDescriptionMetadataMin # of optionsMax # of optionsImage
  *        Limit / Restriction      : 30 Characters30 Characters300 Characters20 Characters120Flow JSON versions before 6.0: 300KBFlow JSON versions after 6.0: 100KB


RadioButtonsGroup
-----------------



* Parameter: type (required) string
  * Description:         "RadioButtonsGroup"      
* Parameter: data-source (required) Array
  * Description:         Dynamic "${data.data_source}"        Flow JSON versions before 5.0: Array< id: String, title: String, description: String, metadata: String, enabled: Boolean>Flow JSON versions after 5.0: Array< id: String, title: String, description: String, metadata: String, enabled: Boolean, image: Base64 of an image, alt-text: string, color: 6-digit hex color string >Flow JSON versions after 6.0: Array< id: String, title: String, description: String, metadata: String, enabled: Boolean, image: Base64 of an image, alt-text: string, color: 6-digit hex color string, on-select-action: {name: 'update_data', payload: {...}}, on-unselect-action: {name: 'update_data', payload: {...}} >
* Parameter: name (required) String
  * Description: 
* Parameter: enabledBoolean
  * Description:         Dynamic "${data.is_enabled}"      
* Parameter: labelstring
  * Description:         Dynamic "${data.label}"           Flow JSON versions before 4.0: optionalFlow JSON versions after 4.0: required
* Parameter: requiredBoolean
  * Description:         Dynamic "${data.is_required}"      
* Parameter: visibleBoolean
  * Description:         Dynamic "${data.is_visible}"          Default: True      
* Parameter: on-select-actionAction
  * Description: data_exchange and update_data are supported.update_dataSupported starting with Flow JSON version 6.0
* Parameter: on-unselect-actionAction
  * Description:                  Only `update_data` is supported.               Supported starting with Flow JSON version 6.0In V6.0, if `on-unselect-action` is not added, `on-select-action` will continue to handle both selection and unselection events. However, if `on-unselect-action` is defined, it will exclusively handle unselection, while `on-select-action` will be used solely for selection.
* Parameter: descriptionString
  * Description:         	Dynamic "${data.description}"          Supported starting with Flow JSON version 4.0
* Parameter: init-valueArray<String>
  * Description:         Dynamic "${data.init-value}"          Only available when component is outside Form component          Supported starting with Flow JSON version 4.0
* Parameter: error-messageString
  * Description:         Dynamic "${data.error-message}"          Only available when component is outside Form component          Supported starting with Flow JSON version 4.0
* Parameter: media-sizeenum
  * Description:         {'regular', 'large'}        Dynamic "${data.media-size}"        Supported starting with Flow JSON version 5.0


Images in WEBP format are not supported on iOS versions prior to iOS 14.

### Example

For the `data-source` field, you can declare it dynamically or statically.

### Static Example

This static example hardcodes the respective `id`'s and `title`'s for the `data-source` field.

### Dynamic Example

In this dynamic example, you can see that `data-source` references the `experience_level_options` of type `array` defined before it using `data.experience_level_options`. When defining such a structure, you need to specify `items` in the `array`, which will be of type `object`. Then inside the `items` object, you have a `properties` dictionary with `id` and `title` just like in the static declaration. Both `id` and `title` will always be of type `String`. Within in the `experience_level_options` array you must define concrete examples in the `__example__` field.

### Limits and Restrictions



*        Type      : Label ContentTitleDescriptionMetadataMin # of optionsMax # of optionsImage
  *        Limit / Restriction      : 30 Characters30 Characters300 Characters20 Characters120Flow JSON versions before 6.0: 300KBFlow JSON versions after 6.0: 100KB




* Parameter: type (required) string
  * Description:         "Footer"      
* Parameter: label (required) string
  * Description:         Dynamic "${data.label}"      
* Parameter: left-captionString
  * Description:         Dynamic "${data.left_caption}"        Can set left-caption and right-caption or only center-caption, but not all 3 at once
* Parameter: center-captionString
  * Description:         Dynamic "${data.center_caption}"        Can set center-caption or left-caption and right-caption, but not all 3 at once
* Parameter: right-captionString
  * Description:         Dynamic "${data.right_caption}"        Can set right-caption and left-caption or only center-caption, but not all 3 at once
* Parameter: enabledBoolean
  * Description:         Dynamic "${data.is_enabled}"      
* Parameter: on-click-action (required) Action
  * Description:         Action      


### Limits and Restrictions


|       Type                                          |       Limit / Restriction      |
|-----------------------------------------------------|--------------------------------|
|Label Max Character LimitCaptions Max Character Limit|3515                            |


OptIn
-----



* Parameter: type (required) string
  * Description:         "OptIn"      
* Parameter: label (required) string
  * Description:         Dynamic "${data.label}"      
* Parameter: requiredBoolean
  * Description:         Dynamic "${data.is_required}"      
* Parameter: name (required) String
  * Description: 
* Parameter: on-click-actionAction
  * Description:         Action that is executed on clicking "Read more".         "Read more" is only visible when an on-click-action is specified.Allowed values are data_exchange and navigate. From Flow JSON version 6.0 and later, allowed values are data_exchange, navigate and open_url.
* Parameter: on-select-actionAction
  * Description:                  Only `update_data` is supported.               Supported starting with Flow JSON version 6.0
* Parameter: on-unselect-actionAction
  * Description:                  Only `update_data` is supported.               Supported starting with Flow JSON version 6.0
* Parameter: visibleBoolean
  * Description:         Dynamic "${data.is_visible}"          Default: True      
* Parameter: init-valueBoolean
  * Description:         Dynamic "${data.init-value}"          Only available when component is outside Form component          Optional FormSupported starting with Flow JSON version 4.0


### Example

### Limits and Restrictions


|       Type                                                |       Limit / Restriction      |
|-----------------------------------------------------------|--------------------------------|
|Content Max Character LimitMax number of Opt-Ins Per Screen|1205                            |


Dropdown
--------



* Parameter: type (required) string
  * Description:         "Dropdown"      
* Parameter: label (required) string
  * Description: 
* Parameter: data-source (required) Array
  * Description:         Dynamic "${data.data_source}"        Flow JSON versions before 5.0: Array< id: String, title: String, description: String, metadata: String, enabled: Boolean>Flow JSON versions after 5.0: Array< id: String, title: String, description: String, metadata: String, enabled: Boolean, image: Base64 of an image, alt-text: string, color: 6-digit hex color string >Flow JSON versions after 6.0: Array< id: String, title: String, description: String, metadata: String, enabled: Boolean, image: Base64 of an image, alt-text: string, color: 6-digit hex color string, on-select-action: {name: 'update_data', payload: {...}}, on-unselect-action: {name: 'update_data', payload: {...}} >
* Parameter: requiredBoolean
  * Description: 
* Parameter: enabledBoolean
  * Description:         Dynamic "${data.is_enabled}"      
* Parameter: requiredBoolean
  * Description:         Dynamic "${data.is_required}"      
* Parameter: visibleBoolean
  * Description:         Dynamic "${data.is_visible}"          Default: True      
* Parameter: on-select-actionAction
  * Description: data_exchange and update_data are supported.update_dataSupported starting with Flow JSON version 6.0
* Parameter: on-unselect-actionAction
  * Description:                  Only `update_data` is supported.               Supported starting with Flow JSON version 6.0In V6.0, if `on-unselect-action` is not added, `on-select-action` will continue to handle both selection and unselection events. However, if `on-unselect-action` is defined, it will exclusively handle unselection, while `on-select-action` will be used solely for selection.
* Parameter: init-valueString
  * Description:         Dynamic "${data.init-value}"          Only available when component is outside Form component      
* Parameter: error-messageString
  * Description:         Dynamic "${data.error-message}"          Only available when component is outside Form component      


Images in WEBP format are not supported on iOS versions prior to iOS 14.

### Example

  

### Limits and Restrictions



*        Type      : LabelTitleMin dropdown optionsMax dropdown optionsDescriptionMetadataImage
  *        Limit / Restriction      : 20 characters30 characters1200 if no images are present in the data-source, 100 otherwise300 characters20 charactersFlow JSON versions before 6.0: 300KBFlow JSON versions after 6.0: 100KB


For the `data-source` field, you can declare it dynamically or statically.

#### Static Example

This static example hardcodes the respective `id`'s and `title`'s for the `data-source` field.

### Dynamic Example

In this dynamic example, you can see that `data-source` references the `experience_level_options` of type `array` defined before it using `experience_level_options`. When defining such a structure, you need to specify `items` in the `array`, which will be of type `object`. Then inside the `items` object, you have a `properties` dictionary with `id` and `title` just like in the static declaration. Both `id` and `title` will always be of type `String`. Within the `experience_level_options` array you must define concrete examples in the `__example__` field.

Embedded Link
-------------



* Parameter: type (required) string
  * Description:         "EmbeddedLink"      
* Parameter: text (required) string
  * Description:         Dynamic "${data.text}"      
* Parameter: on-click-action (required) Action
  * Description:         Action                    Allowed values are data_exchange and navigate. From Flow JSON version 6.0 and later, allowed values are data_exchange, navigate and open_url.
* Parameter: visibleBoolean
  * Description:         Dynamic "${data.is_visible}"          Default: True      


### Limits and Restrictions


|       Type                            |       Limit / Restriction          |
|---------------------------------------|------------------------------------|
|Character limit                        |25                                  |
|Case                                   |No restriction on formatting        |
|Max Number of Embedded Links Per Screen|2                                   |
|Text                                   |Empty or Blank value is not accepted|


DatePicker
----------

The DatePicker component allows users to input dates through an intuitive date selection interface.

Before Flow JSON version 5.0, the DatePicker doesn't support scenarios where the business and the end user are in different time zones. We recommend only using the component if you plan to send your Flows to users in a specific timezone. For details, please refer to section [Guidelines for Usage](#datepicker-guidelines)

Starting from Flow JSON version 5.0, the DatePicker has been updated to use a formatted date string in the format "YYYY-MM-DD", such as "2024-10-21", for setting and retrieving date values. This update makes the date values of the date picker unrelated to time zones, allowing businesses to send messages and collect dates from users in any time zone.



* Parameter: type (required) string
  * Description:     "DatePicker"  
* Parameter: label (required) string
  * Description:     Dynamic "${data.label}"  
* Parameter: min-dateString (timestamp in milliseconds)
  * Description:     Dynamic "${data.min_date}". Please refer to section    Guidelines for Usage
* Parameter: max-dateString (timestamp in milliseconds)
  * Description:     Dynamic "${data.max_date}". Please refer to section    Guidelines for Usage
* Parameter: name (required) string
  * Description: 
* Parameter: unavailable-datesArray < timestamp in milliseconds: String  >
  * Description:     Dynamic "${data.unavailable_dates}". Please refer to section    Guidelines for Usage
* Parameter: visibleBoolean
  * Description:     Dynamic "${data.is_visible}"      Default: True  
* Parameter: helper-textString
  * Description:     Dynamic "${data.helper_text}"  
* Parameter: enabledBoolean
  * Description:     Dynamic "${data.is_enabled}"     Default: True  
* Parameter: on-select-actionAction
  * Description:     Only `data_exchange` is supported.  
* Parameter: init-valueString
  * Description:         Dynamic "${data.init-value}"          Only available when component is outside Form component          Optional FormSupported starting with Flow JSON version 4.0
* Parameter: error-messageString
  * Description:         Dynamic "${data.error-message}"          Only available when component is outside Form component          Optional FormSupported starting with Flow JSON version 4.0


Payload that is sent to a data channel business endpoint is a string which shows the timestamp in milliseconds.

  

### Guidelines for Usage

### Before flow JSON version 5.0

Due to current system limitations, the DatePicker functions correctly and as intended(that is, correct selection range is shown to the User, and accurate user-selection value is returned to the Business) as long as

*   The guidelines in this section are followed
*   Both the business sending the Flow and its end-users are in the same time zone.

Correct behavior is not guaranteed if businesses and end-users are in different time zones. For example, if a business operating in Sao Paulo (UTC-3) sends a Flow to a user in Manaus (UTC-4), the DatePicker may not work as expected. We don't recommend using it if your users are in different time zones than you.

#### Handling of Dates for Businesses and Users in the Same Time Zone

DatePicker allows setting of date range for user selection through `min-dates` and `max-dates` fields, and also prevents selection of specific dates using the `unavailable-dates` field. If you have not supplied the date range , then by default, the component allows the user to select dates from `1 January 1900` to `31 December 2100`.

**Setting Date Parameters in the Component**

When you specify the date range or set unavailable dates, you should convert your local dates with midnight (00:00:00) as a base time to UTC timestamps.

For example, if you are a business based in India who wants to collect a date in the range `21 March 2024` to `25 March 2024`, then you should set `min-dates` and `max-dates` as `1710958020000` and `1711303620000`, respectively.

`21 March 2024, 00:00:00.000 IST` converts to `20 March 2024, 18:30:00.000 UTC` which is represented by timestamp `1710958020000`.

`25 March 2024, 00:00:00.000 IST` converts to `24 March 2024, 18:30:00.000 UTC` which is represented by timestamp `1711303620000`.

**Component Integration**

DatePicker will read the timestamps in `min-dates`, `max-dates` and `unavailable-dates` fields and convert it to the end user's local date for displaying on the UI. In the example we discussed above, a user in India will see dates from `21 March 2024` to `25 March 2024` in the DatePicker component.

**Processing User Selection**

Businesses will receive a UTC timestamp, which should be converted back to the business's local time zone. Importantly, businesses should focus solely on the date portion of the resulting timestamp , disregarding the time portion. This ensures that the date remains consistent with the user's selection. Unfortunately, this conversion will only work correctly when the business and user are in the same time zone.

For example, if you receive a timestamp `1711013400000` then convert it to your local timezone and extract the date. If you are in IST, the timestamp will convert to `21 March 2024 15:00 IST`, and you should treat `21st March 2024` as the user selected date.

#### Recommendation for navigating Time Zone differences

If you need to send flow messages to users in time zones different from yours despite reviewing the above guidelines, follow these steps to overcome the limitation:

*   If you are a business based in Brazil and want to serve flows to your users across the country, then your time zone range will be `UTC-2 (Fernando de Noronha)` to `UTC-5 (Rio Branco)`.
*   Add a `Dropdown` component within your Flow that allows users to select their current time zone.
*   Identify the westernmost time zone from your time zone range. In our example, it is `UTC-5`.
*   Provide the dates you want to collect in the westernmost time zone, using midnight as the reference time. For example, if you want to collect dates from `March 20th, 2024` to `March 25th, 2024`, then provide the timestamp in milliseconds for `March 20th, 2024 at 5 AM UTC` and `March 25th, 2024 at 5 AM UTC`.
*   Convert the timestamps received from the user to their respective time zone and use the corresponding date. For example, if a user is in Sao Paulo(UTC-3) and you receive a timestamp of `1710910800000`, then convert it to `UTC-3` to get `March 20th, 2024`.

### Start from flow JSON version 5.0

DatePicker component has been updated to use a formatted date string in the format "YYYY-MM-DD", such as "2024-10-21", for setting and retrieving date values. This update makes the date values of the date picker unrelated to time zones, allowing businesses to send messages and collect dates from users in any time zone in a consistent manner.

### Limits and Restrictions


|       Type             |       Limit / Restriction      |
|------------------------|--------------------------------|
|Label Max Length        |40 characters                   |
|Helper Text Max Length  |80 characters                   |
|Error Message Max Length|80 characters                   |


CalendarPicker
--------------

Supported starting with Flow JSON version 6.1

The CalendarPicker component allows users to select a single date or a range of dates from a full calendar interface.



* Parameter: type (required) String
  * Description:     "CalendarPicker"  
* Parameter: name (required) String
  * Description: 
* Parameter: titleString
  * Description:     Dynamic "${data.title}"     Only available when 'mode' is set to 'range'  
* Parameter: descriptionString
  * Description:     Dynamic "${data.description}"     Only available when 'mode' is set to 'range'  
* Parameter: label (required) String
  * Description:     Dynamic "${data.label}"     When 'mode' is set to 'range' the value should be in '{"start-date": String, "end-date": String}' format  
* Parameter: helper-textString
  * Description:     Dynamic "${data.helper_text}"     When 'mode' is set to 'range' the value should be in '{"start-date": String, "end-date": String}' format  
* Parameter: requiredBoolean
  * Description:     Dynamic "${data.is_required}"     Default: False     When 'mode' is set to 'range' the value should be in '{"start-date": Boolean, "end-date": Boolean}' format  
* Parameter: visibleBoolean
  * Description:     Dynamic "${data.is_visible}"      Default: True  
* Parameter: enabledBoolean
  * Description:     Dynamic "${data.is_enabled}"     Default: True  
* Parameter: modeenum
  * Description:     {"single", "range"}     Dynamic "${data.mode}"     Default: "single"     Allows to select one date in 'single' mode or start and end dates in 'range' mode  
* Parameter: min-dateString
  * Description:     Dynamic "${data.min_date}"     Formatted date string in the format "YYYY-MM-DD"     Disallows selecting dates before specified min-date  
* Parameter: max-dateString
  * Description:     Dynamic "${data.max_date}"     Formatted date string in the format "YYYY-MM-DD"     Disallows selecting dates after specified max-date  
* Parameter: unavailable-datesArray<String>
  * Description:     Dynamic "${data.unavailable_dates}"     Formatted date strings in the format "YYYY-MM-DD"     Disallows selecting specific dates, should be in the range between min-date and max-date if specified  
* Parameter: include-daysArray<enum>
  * Description:     {"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"}     Dynamic "${data.include_days}"     Default: all weekdays - ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]     Enables specific weekdays, for example to enable only working days Monday through Friday and disallow selecting Saturdays and Sundays  
* Parameter: min-daysInteger
  * Description:     Dynamic "${data.min_days}"     Available only in 'range' mode to set the minimum number of days between start and end dates  
* Parameter: max-daysInteger
  * Description:     Dynamic "${data.max_days}"     Available only in 'range' mode to set the maximum number of days between start and end dates  
* Parameter: on-select-actionAction
  * Description:     Only 'data_exchange' is supported.     Payload that is sent to a data channel business endpoint is a string in "YYYY-MM-DD" format for 'single' mode or dictionary in {"start-date":"YYYY-MM-DD","end-date":"YYYY-MM-DD"} format for 'range' mode  
* Parameter: init-valueString
  * Description:     Dynamic "${data.init-value}"      When 'mode' is set to 'range' the value should be in '{"start-date": String, "end-date": String}' format     Only available when component is outside Form component  
* Parameter: error-messageString
  * Description:     Dynamic "${data.error-message}"      When 'mode' is set to 'range' the value should be in '{"start-date": String, "end-date": String}' format     Only available when component is outside Form component  


### Examples

#### CalendarPicker single mode example

  

#### CalendarPicker range mode example

### Limits and Restrictions


|      Type              |      Limit / Restriction    |
|------------------------|-----------------------------|
|Title Max Length        |80 characters                |
|Description Max Length  |300 characters               |
|Label Max Length        |40 characters                |
|Helper Text Max Length  |80 characters                |
|Error Message Max Length|80 characters                |


Image
-----



* Parameter: type (required) string
  * Description:     "Image"  
* Parameter: src (required) string
  * Description:     Base64 of an image.     Dynamic "${data.src}"  
* Parameter: widthInteger
  * Description:     Dynamic "${data.width}"  
* Parameter: heightInteger
  * Description:     Dynamic "${data.height}"  
* Parameter: scale-typestring
  * Description:     `cover` or `contain`     Default value: `contain`  
* Parameter: aspect-ratioNumber
  * Description:     Default value: 1     Dynamic "${data.aspect_ratio}"  
* Parameter: alt-textstring
  * Description:     Alternative Text is for the accessibility feature, eg. Talkback and Voice over     Dynamic "${data.alt_text}"  


### Image Scale Types



*         Scale Type      : cover
  *        Description      : Image is clipped to fit the image container.If there is no height value (which is the default), the image will be displayed to its full width with its original aspect ratio.If the height value is set, the image is cropped within the fixed height. Depending on the image whether it is portrait or landscape, image is clipped vertically or horizontally.
*         Scale Type      : contain
  *        Description      : Image is contained within the image container with the original aspect ratio.If there is no height value (which is the default), the image will be displayed to its full width with its original aspect ratio.If the height value is set, the image is contained in the image container with the fixed height and the original aspect ratio.Developers should consider setting a specific height, width and aspect ratio for images whenever using contain. On Android devices WhatsApp sets a default height value of 400, which may create some unwanted spacing.


### Example

  

### Limits and Restrictions



*        Type      : Max number of images per screenRecommended image sizeTotal data channel payload sizeSupported images formats
  *        Limit / Restriction      : 3Up to 300kb1 MbJPEGPNG


If
--

Supported starting with Flow JSON version 4.0



* Parameter: type (required) string
  * Description:       "If"    
* Parameter: condition (required) string
  * Description:       Boolean expression, it allows both dynamic and static data. Check section below for more info.
* Parameter: then (required) Array of Components
  * Description:       The components that will be rendered when `condition` is `true`. Allowed components: "TextHeading", "TextSubheading", "TextBody", "TextCaption", "CheckboxGroup", "DatePicker", "Dropdown", "EmbeddedLink", "Footer", "Image", "OptIn", "RadioButtonsGroup", "Switch", "TextArea", "TextInput" and "If"*. It is allowed to nest up to 3 "If" components.      From V7.1 ChipsSelector is also allowed together with all the previous listed components.
* Parameter: elseArray of Components
  * Description:       The components that will be rendered when `condition` is `false`. Allowed components: "TextHeading", "TextSubheading", "TextBody", "TextCaption", "CheckboxGroup", "DatePicker", "Dropdown", "EmbeddedLink", "Footer", "Image", "OptIn", "RadioButtonsGroup", "Switch", "TextArea", "TextInput" and "If"*. It is allowed to nest up to 3 "If" components.            From V7.1 ChipsSelector is also allowed together with all the previous listed components.


### Supported Operators



*       Operator    : Parentheses
  *       Symbol    : ()
  *       Types allowed    : booleannumberstring
  *        Description and examples    : It is used to define the precedence of operations. Or if you want to perform boolean operations that one of the sides is a result of a number or string comparison. It always require an operation within it. One expression can contain multiple parentheses. Examples:${form.opt_in} || (${data.num_value} > 5)${form.opt_in} && (${form.address} != '')!${form.value1}
*       Operator    : Equal to
  *       Symbol    : ==
  *       Types allowed    : booleannumberstring
  *        Description and examples    : It is used to compare booleans, numbers and strings. Both sides should have the same type and at least one of them should contain a dynamic variable. Examples:${form.opt_in} == true${data.num_value} == 5${form.city} == 'London'
*       Operator    : Not equal to
  *       Symbol    : !=
  *       Types allowed    : booleannumberstring
  *        Description and examples    : It is used to compare booleans, numbers and strings. Both sides should have the same type and at least one of them should contain a dynamic variable. Examples:${form.opt_in} != true${data.num_value} != 5${form.city} != 'London'
*       Operator    : AND
  *       Symbol    : &&
  *       Types allowed    : boolean
  *        Description and examples    : It performs the boolean AND operation. It evaluates as true only if both sides are true. This operator has high priority, i.e. it will be evaluated before other operators. The exception is parentheses, if one of the sides contain an opening or closing parenthesis, then the parenthesis is evaluated first. Example:${form.opt_in} && ${data.boolean_value}
*       Operator    : OR
  *       Symbol    : ||
  *       Types allowed    : boolean
  *        Description and examples    : It performs the boolean OR operation. It evaluates as true if at least one side is true. Example:${form.opt_in} || ${data.boolean_value}
*       Operator    : NOT
  *       Symbol    : !
  *       Types allowed    : boolean
  *        Description and examples    : It performs the boolean NOT operation. It negates the statement after it. It can be used before immediately boolean values or parentheses (that will result into boolean values) Examples:!(${form.opt_in} || ${data.boolean_value})!(${data.num_value} > 5)!${form.value1}
*       Operator    : Greater than
  *       Symbol    : >
  *       Types allowed    : number
  *        Description and examples    : It is used to compare to numbers. At least one of them should be a dynamic variable. Examples:${data.num_value} > 5${data.num_value} > ${data.num_value2}
*       Operator    : Greater than or equal to
  *       Symbol    : >=
  *       Types allowed    : number
  *        Description and examples    : It is used to compare to numbers. At least one of them should be a dynamic variable. Examples:${data.num_value} >= 5${data.num_value} >= ${data.num_value}
*       Operator    : Less than
  *       Symbol    : <
  *       Types allowed    : number
  *        Description and examples    : It is used to compare to numbers. At least one of them should be a dynamic variable. Examples:${data.num_value} < 5${data.num_value} < ${data.num_value2}
*       Operator    : Less than or equal to
  *       Symbol    : <=
  *       Types allowed    : number
  *        Description and examples    : It is used to compare to numbers. At least one of them should be a dynamic variable. Examples:${data.num_value} == 5${data.num_value} <= ${data.num_value}


### Example

### Rules

#### Condition

*   Should have at least one dynamic value (e.g. `${data...}` or `${form...}`).
*   Should always be resolved into a boolean (i.e. no strings or number values).
*   Can be used with literals but should not only contain literals.

#### Footer

*   `Footer` can be added within `If` only in the first level, not inside a nested `If`.
*   If there is a `Footer` within `If`, it should exist in both branches (i.e. `then` and `else`). This means that `else` becomes mandatory.
*   If there is a `Footer` within `If` it cannot exist a footer outside, because the max count of `Footer` is 1 per screen.

### Limitations and restrictions

The table below show examples of limitations and validation errors that will be shown for certain cases.



*       Scenario    : Given there is a footer component inside thenAnd else is not definedWhen validating the flowThen it should show a validation error
  *       Validation error shown    : Missing Footer inside one of the if branches. Branch "else" should exist and contain one Footer.
*       Scenario    : Given there is a footer component inside thenAnd there is no footer inside elseWhen validating the flowThen it should show a validation error
  *       Validation error shown    : Missing Footer inside one of the if branches.
*       Scenario    : Given there is no footer component inside thenAnd there is a footer inside elseWhen validating the flowThen it should show a validation error
  *       Validation error shown    : Missing Footer inside one of the if branches.
*       Scenario    : Given there is a footer component inside thenAnd there is a footer component inside elseAnd there is a footer component outside the IfWhen validating the flowThen it should show a validation error
  *       Validation error shown    : You can only have 1 Footer component per screen.
*       Scenario    : Given there is an empty array defined for thenWhen validating the flowThen it should show a validation error
  *       Validation error shown    : Invalid value found at: "$root/screens/path_to_your_component/then" due to empty array. It should contain at least one component.


Switch
------

Supported starting with Flow JSON version 4.0



* Parameter: type (required) string
  * Description:       "Switch"    
* Parameter: value (required) string
  * Description:       A variable that will have its value evaluated during runtime. Example      - `${data.animal}`    
* Parameter: cases (required) Map of Array of Components
  * Description:       Each property is a key (string) that maps to an Array of Components. When the `value` matches the key, it renders its array of components. Allowed components: "TextHeading", "TextSubheading", "TextBody", "TextCaption", "CheckboxGroup", "DatePicker", "Dropdown", "EmbeddedLink", "Footer", "Image", "OptIn", "RadioButtonsGroup", "TextArea", "TextInput".            From V7.1 ChipsSelector is also allowed together with all the previous listed components.


### Example

### Rules

#### Cases

*   Should have at least one value. It cannot be empty (e.g. `"cases": {}`)

### Limitations and restrictions

The table below show examples of limitations and validation errors that will be shown for certain cases.



*       Scenario    : Given there is a Switch componentAnd its cases property is emptyWhen validating the flowThen it should show a validation error
  *       Validation error shown    : Invalid empty property found at: "$root/screens/path_to_your_component/cases".


Navigation List
---------------

Supported from Flows v6.2+.

The NavigationList component allows users to navigate effectively between different screens in a Flow, by exploring and interacting with a list of options. Each list item can display rich content such as text, images and tags.



* Parameter: type (required) string
  * Description:           "NavigationList"        
* Parameter: name (required) string
  * Description: 
* Parameter: list-items (required) array
  * Description:           Dynamic "${data.list_items}"        
* Parameter: labelstring
  * Description:           Dynamic "${data.label}"        
* Parameter: descriptionstring
  * Description:           Dynamic "${data.description}"        
* Parameter: media-sizeenum
  * Description:            {'regular','large'}           Default: 'regular'           Dynamic "${data.media-size}"        
* Parameter: on-click-actionaction
  * Description:           `data_exchange` and `navigate` are supported.        


Each item in the list of items supports the following properties:


|Parameter                     |Description                                                    |
|------------------------------|---------------------------------------------------------------|
|main-content (required) object|(required) title <string>description <string>metadata <string> |
|endobject                     |title <string>description <string>metadata <string>            |
|startobject                   |(required) image <base64 encoding of an image>alt-text <string>|
|badgestring                   |                                                               |
|tagsArray<string>             |                                                               |
|on-click-actionaction         |          `data_exchange` and `navigate` are supported.        |


Images in WEBP format are not supported on iOS versions prior to iOS 14.

The `on-click-action` is required for the component, and it can be defined either:

*   Once at component-level and it will apply the same action for all items in the list.
    
*   Individually, on each item in the list to allow for different actions to be triggered.
    

### Example

### Dynamic Example

In this dynamic example, you can see that `list-items` references the `insurances` of type `array` defined before it using `insurances`. When defining such a structure, you need to specify `items` in the `array`, which will be of type `object`. Then inside the `items` object, you have a `properties` dictionary with `id` and `main-content` just like in the static declaration. Both `id` will always be of type `string` and `main-content` will always be of type `object`, and accompanied by a definition of its structure. Within the `insurances` array, you must define concrete examples in the `__example__` field.

### Limits and Restrictions

*   The \`Navigation List\` component cannot be used on a terminal screen.
    
*   There can be at most 2 \`Navigation List\` components per screen.
    
*   The \`Navigation List\` components cannot be used in combination with any other components in the same screen.
    
*   There can be only one item with a \`badge\` per list.
    
*   The \`end\` add-on cannot be used in combination with \`media-size\` set to \`large\`.
    
*   The \`on-click-action\` cannot be defined simultaneously on component-level and on item-level.
    

#### Component restrictions


|Property   |Limit / Restriction                                                               |
|-----------|----------------------------------------------------------------------------------|
|list-items |minimum 1 and maximum 20 itemsContent will not be rendered if the limit is reached|
|label      |80 charactersContent will truncate if the limit is reached                        |
|description|300 charactersContent will truncate if the limit is reached                       |


#### List items restrictions

Content over the limit specified will not be rendered.



* Add-on / property: start
  * Property: image
  * Limit / Restriction: 100KBImages over the limit will be replaced by a placeholder
* Add-on / property: main-content
  * Property: titledescriptionmetadata
  * Limit / Restriction: 30 characters20 characters80 characters
* Add-on / property: end
  * Property: titledescriptionmetadata
  * Limit / Restriction: 10 characters10 characters10 characters
* Add-on / property: badge
  * Property: 
  * Limit / Restriction: 15 characters
* Add-on / property: tags
  * Property: 
  * Limit / Restriction: 15 characters3 items


Chips Selector
--------------

Chips Selector component allows users to pick multiple selections from a list of options.

Supported starting with Flow JSON version 6.3



* Parameter: type (required) string
  * Description:         "ChipsSelector"      
* Parameter: data-source (required) Array
  * Description:         Dynamic "${data.data_source}"        Array< id: String, title: String, enabled: Boolean, on-select-action: {name: 'update_data', payload: {...}}, on-unselect-action: {name: 'update_data', payload: {...}} >
* Parameter: name (required) String
  * Description: 
* Parameter: min-selected-itemsInteger
  * Description:         Dynamic "${data.min_selected_items}"      
* Parameter: max-selected-itemsInteger
  * Description:         Dynamic "${data.max_selected_items}"      
* Parameter: enabledBoolean
  * Description:         Dynamic "${data.is_enabled}"      
* Parameter: label (required) string
  * Description:         Dynamic "${data.label}"      
* Parameter: requiredBoolean
  * Description:         Dynamic "${data.is_required}"      
* Parameter: visibleBoolean
  * Description:         Dynamic "${data.is_visible}"          Default: True      
* Parameter: descriptionString
  * Description:         	Dynamic "${data.description}"      	
* Parameter: init-valueArray<String>
  * Description:         Dynamic "${data.init-value}"          Only available when component is outside Form component      
* Parameter: error-messageString
  * Description:         Dynamic "${data.error-message}"          Only available when component is outside Form component      
* Parameter: on-select-actionAction
  * Description:                   `data_exchange` and `update_data` are supported.           update_dataSupported starting with Flow JSON version 7.1
* Parameter: on-unselect-actionAction
  * Description:               Only `update_data` is supported.          Supported starting with Flow JSON version 7.1In V7.1, if `on-unselect-action` is not added, `on-select-action` will continue to handle both selection and unselection events. However, if `on-unselect-action` is defined, it will exclusively handle unselection, while `on-select-action` will be used solely for selection.


If `on-unselect-action` is not added, `on-select-action` will continue to handle both selection and unselection events. However, if `on-unselect-action` is defined, it will exclusively handle unselection, while `on-select-action` will be used solely for selection.

### Limits and Restrictions


|       Type                                     |       Limit / Restriction      |
|------------------------------------------------|--------------------------------|
|LabelDescriptionMin # of optionsMax # of options|80 Characters300 Characters220  |


### Example

Image Carousel
--------------

The Image Carousel component allows users to slide through multiple images.

Supported from Flows v7.1+.


|Parameter              |Description                                                          |
|-----------------------|---------------------------------------------------------------------|
|type (required) string |        "ImageCarousel"                                              |
|images (required) array|        Dynamic "${data.images}"                                     |
|aspect-ratiostring     |        Either "4:3" or "16:9".        Default: "4:3".               |
|scale-typestring       |        Either "contain" or "cover".        Default: "contain".      |


Each item in the list of images supports the following properties:


|Parameter                 |Description                                               |
|--------------------------|----------------------------------------------------------|
|src (required) string     |       Base64 of an image.                                |
|alt-text (required) string|      Alternative text for for accessibility purposes.    |


### Limits and Restrictions



*        Type      : Min # of imagesMax # of imagesMax # of ImageCarousel per screenMax # of ImageCarousel per Flow
  *              Limit / Restriction            : 1323


### Example

Dynamic components
------------------

Here's a corrected version:

If you check the attribute model of certain components (`Dropdown`, `DatePicker`, `RadioGroup` and `CheckboxGroup`), you will find that some of them accept the `on-xxxx-action` attribute. This attribute allows the component to trigger a data-exchange action. It can be used in the following scenarios:

1.  When a user selects a date in the DatePicker component.
2.  When the business needs to fetch available data (such as table slots, tickets, etc.) for this selected date by calling a data\_exchange action.
3.  Once the data is received, the user will see an updated screen with new data.

Prerequisites
-------------

The following steps require communication between the client and the business server. Please ensure that you have configured the data channel before attempting to use this feature.

Step 1 - Defining the layout
----------------------------

Let's begin with a minimal example, consisting of an empty form and a CTA button, and gradually add more components.

So, we want to build a simple form that takes a date and displays the list of available time slots. First, we'll add a `DatePicker` component:

Next step is to add a `Dropdown` where we will display all available timeslots:

Step 2 - Defining 3P Data
-------------------------

Until now, we've been incorporating static mock data, but now we aim to connect a screen with dynamic data. Dynamic data can originate from various sources:

1.  Initial message payload
2.  `navigate` - transitioning from the previous screen using a `navigate` action
3.  `data_exchange` - a request to the business server

In this example, we'll assume that the data will come from a `data_exchange` request. So, let's instruct Flow JSON to use the data channel request by providing the `"data_api_version": "3.0"` property.

Step 3 - Allowing DatePicker to Make a Request to the Server
------------------------------------------------------------

Let's provide `"on-select-action"` to the `DatePicker` component so we can execute the call to the business server. In the `payload`, we can pass any data we want to the business server to understand the type of request.

```
{
   "on-select-action":{
      "name":"data_exchange",
      "payload":{
         "date":"${form.date}",
         "component_action":"update_date"
      }
   }
}
```


In this example, we'll send the value of the field `date` to the action payload, and we'll also add some static data `"component_action": "update_date"` to help the server recognize the type of request. There is no strict format here; you can choose whatever works for your case.

Now when you try to select a date, a `data_exchange` request will be executed. The server may return the data that can change the UI. For now, our Flow doesn't expect or use any data from the server. Let's fix it by first defining the data model that we expect for a screen.

Step 4 - Define a Server Data Model
-----------------------------------

Let's declare a `data` property for the screen outlining the data that we expect to receive from the server. So, we want to receive an `available_slots` array with timeslot options.

It should have the following model. The `__example__` field is mock data used to display the data within the web preview.

```
{
    "available_slots": {
        "type": "array",
        "items": {
            "type": "object",
            "properties": { "id": {"type": "string"}, "title": {"type": "string"} }
        },
        "__example__": [ {"id": "1", "title": "08:00"}, {"id": "2", "title": "09:00"} ]
    }
}
```


It means that the expected payload to be returned from server can look like the following:

```
{
    "version": "3.0",
    "screen": "BOOKING",
    "data": {
       "available_slots": [ {"id": "1", "title": "08:00"}, {"id": "2", "title": "09:00"} ]
    }
}
```


So you Flow JSON now should look like the following:

Step 5 - Control Visibility of the Component
--------------------------------------------

Now, when we select a date in `DatePicker`, the application will send a request to the business server to get available timeslots. However, we don't want a `Dropdown` to be visible until there is data to display. How can we hide it?

For this purpose, we can use the `visible` attribute on `Dropdown` and connect it with server data. The business server can control the visibility of the component based on a set condition.

So, we need to make the following changes:

1.  Define `is_dropdown_visible` in the `data` model of the screen.
2.  Connect a property via dynamic binding `"visible": "${data.is_dropdown_visible}"`.
3.  Ensure that the server returns the correct data.

**Let's update our code:**

_NOTE: The current version of the playground doesn't support endpoint requests_

Summary
-------

That's it! Now you have a dynamic component set up. If you're facing any challenges, feel free to ask a question on the developer forum. We'll be happy to help!