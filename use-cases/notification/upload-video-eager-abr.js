require('dotenv').config();
const cloudinary = require('cloudinary').v2;

// this eager upload transformation is good for processing long form video (duration >1 minute)
// eager async upload to create derived  manifests and chunked video files
// asynchronously to avoid delays with on the fly transformations

// Your webhook might looks like this: https://my-cld-webhooks.netlify.app/.netlify/functions/webhook_notify_email


// you may want to replace the video uploaded to use your own
// this can be a local or remote file
cloudinary.uploader
  .upload(
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
  .then((result) => console.log(JSON.stringify(result, null, 2)))
  .catch((error) => console.log.log(error));
