# Webhooks


The code here is an application with Netlify Functions. These functions are backend and can be uses as APIs.  We'll use them as webhooks. 

The front end is minimal and the focus is on the functions.  It is ready for deployment to Netlify.  

## Functions and Use Cases
The use cases are build around Cloudinary Upload API processing.  

The functions in the `/functions` directory will become your webhooks.  You can use them in the scripts found in the `/use-cases` directory.

The `moderation` use cases will use:

- webhook_process_google-moderation_queues
- webhook_process_approved_queue
- webhook_process_rejected_queue

The `notification` use cases uses the SendGrid API to send email.  It uses

- webhook_notify_email

## Using SendGrid in a Netlify Function to Notify Process Completion

Creating optimized video derivatives with transformations involves processing that can take time. It would be helpful to receive an email 
with the Cloudinary response showing that the processing completed successfully.  
We'll run the video processing as an eager transformation. We'll use the `notification_url` option to add a webhook.  We'll create a Netlify Function, which gives us an API that we can use for a webhook.  When the processing is complete, the Netlify Function will call SendGrid's email `send` function to forward the Cloudinary response to a predefined email address.

If you have deployed the `functions/webhook_notify_email` function, you can use the URL you have created as the webhook in `notification/upload-video-eager` script.   Execute the upload and check the email specified in your setup for the eager upload response.

## Managing the Queues in a Google Video AI Moderation Process

We can use the Cloudinary add-on Google Video AI Moderation to examine uploaded video. This add-on looks for content that you might not want to serve to
your website, like pornography or violence.  When processing is complete, the add-on will put the video into an `approved` or `rejected` queue.  

You can view these queues online in the DAM.  
This add-on is helpful when we are allowing our users to upload video content. We don't want these videos to be served unless they are marked approved. To 
guarantee they can't be served, we upload them with  the `access_control` option containing an `access_item` with a value of `token`.  As long as 
the video has this token, it can't be served.  

After the upload is complete, Cloudinary will run it through the Video Moderation process based on options provided with the Upload API command.  While this process is running, the video is put in the `pending` queue.  If you look at the Google Moderation Queue at this point, you'll see both of the videos in the `pending` queue. 

We can supply a webhook that will be get called when the moderation step is complete.  At that point, the video will be moved to either the `approved` or `rejected` queue depending on the analysis.  Then the webhook is called.  

We'll deploy a Netlify Function to serve as the webhook.  This function will call one function to process the approved queue and one to process the rejected queue.  If the video is **approved**, it will be updated using the Admin API `update` function so that the `access_item:token` is replaced with `access_item:anonymous`.  This will make it available to be served.  If the video is **rejected**, it will be deleted.  
If we look at the Google Moderation Queue at the end of the processing, we'll see that approved video is in the approved queue and we won't find the `rejected` video as it will have been deleted.

### 60 Second Sleep
If you look at the moderation queue in the DAM within 60 seconds, you should see both video in the pending queue. The 60 second availability is made possible by a call to `sleep` in the webhook.  This is just for demo purposes. 


## Deploy to Netlify
See [NETLIFY_DEPLY.md](https://github.com/cloudinary-training/cld-webhooks/blob/main/NETLIFY_DEPLOY.md) for instructions on deploying functions to netlify.
