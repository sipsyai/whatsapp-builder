# Testing & Debugging - WhatsApp Flows - Documentation - Meta for Developer

There are multiple options available to developers to test and debug their flows.

To test and verify that flow works as expected developers can use:

-   [Interactive preview](https://developers.facebook.com/docs/whatsapp/flows/guides/testingdebugging#test-flow-using-the-interactive-preview)
-   [Draft flow message](#send-draft-flow-to-your-device)

To debug any issues with the flow developers can use:

-   [Action tab in the Flow Builder](#debug-flow-actions-using-actions-section-of-builder)
-   [Endpoint health check](#)

## Test flow using the interactive preview

![](https://scontent.fist1-1.fna.fbcdn.net/v/t39.8562-6/452048961_1627579184692316_1220770803723561864_n.png?_nc_cat=102&ccb=1-7&_nc_sid=f537c7&_nc_ohc=N8iOIL1OIaoQ7kNvwEUwmTH&_nc_oc=Adn4F-FW6zxgidc18EhydnRhRqaFUzP0vyJXIkFKOfCS5jwuXX3yDgG5R3TTcYEJd2k&_nc_zt=14&_nc_ht=scontent.fist1-1.fna&_nc_gid=9pyA7QY9sjID32q3oEk8Ow&oh=00_AfiwBahemsdua-mHwugxil-5Hb_hAQMdUNInP6iW_3paxw&oe=6928E8FB)

Interactive preview allows easy testing of the flow throughout the development process. Interactive preview triggers the same actions as the real device would, and if the flow has an endpoint configured it will send encrypted requests to the endpoint. To start interactive prevew:

1.  Navigate to the [Flows page in WA Account Manager](https://business.facebook.com/wa/manage/flows/) and click on any Flow.
    
2.  Trigger the interactive preview by clicking on settings menu in the **Preview** section of the Flow Builder and enabling **Interactive mode** toggle.
    
3.  In the modal that appears, select the phone number, enter any string as **Flow token** and choose how to **Request data on first screen**.

You can now interact and complete the flow in the preview. Each action will be logged in the **Action** tab on the bottom of the editor where you can see more details. If the Flow is using an endpoint each 
```
data_exchange
```
 action will trigger the request to the endpoint. Full request and response are also visible in **Action** tab.

## Send draft flow to your device

![](https://scontent.fist2-4.fna.fbcdn.net/v/t39.8562-6/452507828_1538300680441813_878959295149397567_n.jpg?_nc_cat=100&ccb=1-7&_nc_sid=f537c7&_nc_ohc=dUJAV4Hzvx0Q7kNvwE4UBpy&_nc_oc=AdmtiChETQUinpD_ljsldA3csvQcfClat_2IoSuWJY418n5WM7MnUyORqpfSe9o6cFo&_nc_zt=14&_nc_ht=scontent.fist2-4.fna&_nc_gid=9pyA7QY9sjID32q3oEk8Ow&oh=00_AfgCbU3YbMTbO4KyAX8ucg6Ds0zd40StQWSLd9t66XGXUQ&oe=6928E41C)

Before you publish your flow you can also send it and test it on a real device. Flow messages sent in draft mode show a warning banner on the device. Once a Flow is published this warning is not displayed.

Ensure you first send a message from your test device to the sender number. This is to make sure that you are within the 24-hour customer service window to receive the message. [Learn more](https://developers.facebook.com/docs/whatsapp/pricing/#customer-service-windows)

1.  Navigate to the [Flows page in WA Account Manager](https://business.facebook.com/wa/manage/flows/) and click on any Flow in _Draft_ state.
    
2.  In the Flow Builder select **three dot** menu in the top right corner of the screen and select **Send** option.
    
3.  In the modal select **Sender number** from the list. As the **Recipient phone number**, enter the phone number of your test device.
    
4.  Enter any string as a **Flow token** (TBC link to learn more about flow tokens here), select the **Request Data option** (TBC link learn more about Providing data for first screen) and click on **Send**.

You should receive a message with a Flow attached to your device and be able to test the Flow.

Draft messages can also be [sent via API](https://developers.facebook.com/docs/whatsapp/flows/gettingstarted/sendingaflow#interactive-message-parameters) by setting 
```
mode
```
 parameter to 
```
draft
```
.

## Debug Flow actions using Actions section of Builder

![](https://scontent.fist1-1.fna.fbcdn.net/v/t39.8562-6/451830447_1580778359463620_6499617590425646025_n.png?_nc_cat=105&ccb=1-7&_nc_sid=f537c7&_nc_ohc=E-ElWruvtdwQ7kNvwGclHZF&_nc_oc=AdmHcpfCEbLlBm035R_SCUS8ibVLcrRM3Kv451pX3Ef7Y2nLDG11rPBDZB-_I7_Gr1E&_nc_zt=14&_nc_ht=scontent.fist1-1.fna&_nc_gid=9pyA7QY9sjID32q3oEk8Ow&oh=00_AfhkHk4qY-kNNGP0b7sBRQDVE-gaQlol8sHEYzcRlKHbTQ&oe=6928EAC8)

When the Interactive preview is enabled each Flow action is logged in the Actions tab at the bottom of the code editor in the Flow Builder.

**Flows without endpoint**

For Flows without an endpoint the Action tab will show:

-   ```
    navigate
    ```
     actions including any data passed between the screens
-   ```
    back
    ```
     action when user clicks on back button
-   ```
    complete
    ```
     action with the full payload submitted at the Flow completion

**Flows with endpoint**

For Flows with an endpoint the Action tab will show all the actions:

-   ```
    init
    ```
     action with initial data returned by the endpoint
-   ```
    navigate
    ```
     actions including any data passed between the screens
-   ```
    data_exchange
    ```
     actions with HTTP status code, unencrypted request send to the endpoint and unencrypted response received from it.
-   ```
    back
    ```
     action when user clicks on back button
-   ```
    complete
    ```
     action with the full payload submitted at the Flow completion

## Debug endpoint configuration and encryption setup using Health Check

![](https://scontent.fist2-3.fna.fbcdn.net/v/t39.8562-6/451497131_1041194997674508_215072072469613384_n.png?_nc_cat=106&ccb=1-7&_nc_sid=f537c7&_nc_ohc=9FMjzkcqHlYQ7kNvwGUu8S-&_nc_oc=AdlRmq-ck1mqI27EnCRkUg7Z_6cUtHoPwSBT1-fzrxCicIuBu3zwiDVznJeB3AnvdKA&_nc_zt=14&_nc_ht=scontent.fist2-3.fna&_nc_gid=9pyA7QY9sjID32q3oEk8Ow&oh=00_AfiabxNYiwXKDjIgQn1_SAgHLUYSrXuWTHp2YHwytStMgA&oe=6928DCAA)

The Health Check allows users to verify that the endpoint health check ping request and encryption are working correctly.

Endpoint Health Check is accessible from the Flow Builder, from the three dot menu in top right corner of the screen. Select **Setup** under the **Endpoint** section. In the modal select **Health check** step and click on **Run Check** button to trigger the check.

Health Check triggers a ping against the provided endpoint URI and if there's an error, it returns detailed error and resolution information.

It detects various issues such as:

-   _Missing/incorrect configuration_: It checks whether all the pre-requisites are set up correctly. For example whether the public key is uploaded, or whether the endpoint URI is set.
-   _Endpoint not being reachable or responding correctly_: It checks whether the provided endpoint URI is reachable from the internet, whether it is responsive, and whether it returns expected status code.
-   _Encryption_: It checks whether the response is encrypted, whether it is encrypted with the correct key, and whether it is base64 encoded.
-   _Payload_: It checks whether the response payload is as expected.