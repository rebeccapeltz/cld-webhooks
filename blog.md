---
title: Webhook-Driven Email Notifications for Media Management
published: true
description: Implement with a webhook API the capability of notifying interested parties by email the status of a media-transformation process.
tags: webhook, Cloudinary, SendGrid,  Netlify
cover_image: https://dev-to-uploads.s3.amazonaws.com/uploads/articles/113s27exwgj6ti6yp9z6.png
---

Building low-code flows with APIs is steadily gaining popularity, and [related application platforms](https://www.gartner.com/reviews/market/enterprise-low-code-application-platform) abound. Developers would find it a plus to gain the expertise of using low-code to implement webhooks, that is, APIs that effectively “hook” features together in different systems.

This article shows you how to build a webhook API and deploy it in a Netlify Function. The webhook API is called by the  Cloudinary Upload API when a long-running process completes. The webhook API forwards the response via email to designated parties. Specifically, you run a script—an asynchronous process—to apply the transformations in preparation for the deployment of the video with adaptive bitrate (ABR) streaming. To enable you and other parties concerned to know when the process completes, the webhook API notifies you by email of the status—along with the URLs of the derived video files. 


- **The Problem:** We Need to Get Notified When a Process Completes
- **Design** a Webhook API for Media Processing With the [SendGrid API](https://sendgrid.com/solutions/email-api/)
- **Code and Deploy** a Webhook API With Node.js and [Netlify Functions](https://www.netlify.com/products/functions)
- **Test** the Upload Script
- **Secure** the Media-Processing Webhook


## The Problem: We Need to Get Notified When a Process Completes
Video processing can take time to complete. We run a script to create the transformations for serving up a video with Adaptive Bitrate Streaming (ABR)—a process that runs asynchronously. After executing the script, we get a response from Cloudinary that the transformations are proceeding. Ideally, add a notification URL to the script so that we can tackle other tasks during the process, assured that we'll be notified when the process is complete and the video is deployment ready.

Let’s code a webhook API and deploy it in a Netlify function. That API receives the upload response and emails it to the parties in a recipient list.

## Design a Webhook API With the SendGrid API
We can find out if a long-running asynchronous process has completed by means of webhooks. This flowchart illustrates the automated steps:

![Email flow](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/xzzxgu73txfk2xvn0hc7.png)



Here’s a more detailed rundown:

1. We execute a script that calls the Cloudinary Upload API and that applies eager transformations, which generate derived video files. The script also specifies the `eager_async` option. Since the upload process runs asynchronously, we need not wait for it to complete. Finally, we specify in the script a notification URL, i.e., a webhook that forwards the response in an email. Thus, when eager processing is complete, the response posts to the URL.

2. Asynchronous processing creates the manifest files and the HLS video-fragment files required for ABR streaming. Below is the code built with Cloudinary’s Node.js SDK for asynchronous processing. If you want to run this script, you would replace the `<WEBHOOK>` with a URL.
    ```JavaScript
    cloudinary.uploader.upload(
    'https://res.cloudinary.com/cloudinary-training/video/upload/v1626130641/mountain.mov',
       {
           resource_type: 'video',
           type: 'upload',
           eager: [
             { streaming_profile: 'full_hd', format: 'm3u8' },
             {
               format: 'mp4',
               transformation: [{ quality: 'auto' }],
             },
           ],
           eager_async: true,
           eager_notification_url: '<WEBHOOK>',
       }
     )
    ```
3. When processing is complete, Cloudinary posts the response to the webhook API. The response contains the URLs of the derived files. A sample response that we would see in the email is shown below
    ```JavaScript
    {
      "notification_type": "eager",
      "timestamp": "2022-03-12T17:41:22+00:00",
      "request_id": "c8450346e4d31ff9b3b7b4e169aecb26",
      "eager": [
        {
          "transformation": "sp_full_hd/m3u8",
          "bytes": 1007,
          "format": "m3u8",
          "url": "http://res.cloudinary.com/ac-self-service/video/upload/sp_full_hd/v1647106802/e7osszr9rn0zx43vuysm.m3u8",
          "secure_url": "https://res.cloudinary.com/ac-self-service/video/upload/sp_full_hd/v1647106802/e7osszr9rn0zx43vuysm.m3u8"
        },
        {
          "transformation": "q_auto/mp4",
          "width": 1280,
          "height": 720,
          "bytes": 8807563,
          "format": "mp4",
          "url": "http://res.cloudinary.com/ac-self-service/video/upload/q_auto/v1647106802/e7osszr9rn0zx43vuysm.mp4",
          "secure_url": "https://res.cloudinary.com/ac-self-service/video/upload/q_auto/v1647106802/e7osszr9rn0zx43vuysm.mp4"
        }
      ],
      "batch_id": "6f006cbe147ac3ff22bf610e4e3f7482b5f3201625c5c87ccb1fdf2bb105e4a3",
      "asset_id": "69745e7be77ffdc2c9ad14491074d58d",
      "public_id": "e7osszr9rn0zx43vuysm"
    }
```

4. The [ notification webhook API](https://github.com/rebeccapeltz/cld-webhooks/blob/main/functions/webhook_notify_email.js) emails the information in the response to the designated parties through an API of SendGrid, a cloud service for email.  See below for the code of the webhook API, which is structured as an asynchronous handler, a common pattern for low-code server functions. Note that clickTracking is disabled so that the parties notified can browse those URLs in the email. 
    ```JavaScript
    exports.handler = async function (event, context) {
      const data = JSON.parse(event.body);
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
 
        const response = await sgMail.sendMultiple({
          to: process.env.TO_RECIPIENTS.split(' '),
          from: process.env.FROM_VERIFIED_SENDER,
          subject: 'Webhook Notification',
          text: JSON.stringify(data, null, 2),
          trackingSettings: {
            clickTracking: {
              enable: false
            }
          }});
        return {
          statusCode: response[0].statusCode,
          body: JSON.stringify({ message: response[0] }),
        };
    };
    ```
5. The email recipients proof and deploy the video.

## Code and Deploy the Webhook API With Node.js and Netlify Functions
[Code repository](https://github.com/cloudinary-training/cld-webhooks)

Now that the design of the automated flow is in place, code and deploy it. Perform the two steps below to build a webhook API that notifies designated parties of the Cloudinary Upload API’s eager response by email:
1.  Create two accounts, one for [SendGrid](https://sendgrid.com/) and the other for [Netlify](https://www.netlify.com/), and then deploy this [code](https://github.com/cloudinary-training/cld-webhooks/blob/main/functions/webhook_notify_email.js) as a Netlify Function.  [Detailed setup instructions](https://github.com/rebeccapeltz/cld-webhooks/blob/main/NETLIFY_DEPLOY.md) will help you with deployment.

2. Upload a video by running the Node.js script [upload-video-eager-abr](https://github.com/cloudinary-training/cld-webhooks/blob/main/use-cases/notification/upload-video-eager-abr.js), which creates manifests and video “chunks” that enable ABR streaming with Cloudinary transformations bundled in a profile, in which—

- The `eager_async` option causes Cloudinary to process the video asynchronously.
- The URL assigned to `eager_async_notification_url` is the webhook API that we created in Netlify.

Afterward, Cloudinary posts the eager response, which reports the success or failure of the transformation process and lists the URLs of the derived assets, to the webhook API. The API then sends all that information to the designated parties by email.

## Test the Upload Script
To test the [upload-video-eager-abr](https://github.com/cloudinary-training/cld-webhooks/blob/main/use-cases/notification/upload-video-eager-abr.js) script, go to [https://webhook.site](https://webhook.site) to obtain a free URL on which to view the eager response. 

**Tip:** Start by experimenting with webhook.site’s tracking page. Once we’ve verified that the upload process is posting correctly there, proceed with the steps of having our webhook API send email notifications with the details in the eager response. 

![webhook.site](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/afm20ru6soawmaalu67r.png) 



## Secure the Media Processing Webhook
Be sure to guard the webhook API against unauthorized access. An ideal way to do that is by leveraging Cloudinary features like signatures and timestamps, as well as a Cloudinary utility that ensures that the API is called by Cloudinary only for legitimate purposes. 

For details, see the Cloudinary documentation on [verifying notification signatures](https://cloudinary.com/documentation/notifications#verifying_notification_signatures).


## Automate Low-Code Flows With Webhooks. 

The above example shows you how to write low-code and package it in a simple and modular webhook API that receives a response from Cloudinary. To facilitate tracking, that API notifies you and other interested parties of the status of the process through SendGrid (for dispatching email) and Netlify (for serving APIs).
Webhooks are a handy starting point for automated low-code flows, which are hosted by many popular services. For more details on building similar flows for media, check out MediaFlows, a product of Cloudinary Labs. 


