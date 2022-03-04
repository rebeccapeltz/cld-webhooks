require('dotenv').config();
const sgMail = require('@sendgrid/mail');

// set up an async function to server as handler
exports.handler = async function (event, context) {
  // fail if not a POST
  if (!event.body || event.httpMethod !== 'POST') {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({
        status: 'invalid-method',
      }),
    };
  }

  // get data from POST
  const data = JSON.parse(event.body);
  // console.log(JSON.stringify(data, null, 2));

  // register the SendGrid API KEY
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  // set up a SendGrid message
  // the TO_RECIPIENTS variable contains 1 or more email addresses separated by space
  // for example "bob@abc.com sally@abc.com"
  // the  FROM_VERIFIED_SENDER is the email address registered with SEND_GRID
  // we're forwarding the Cloudinary response data and it contains URL
  // disable clickTracking so that URLs are passed as received here
  const msg = {
    to: process.env.TO_RECIPIENTS.split(' '),
    from: process.env.FROM_VERIFIED_SENDER,
    subject: 'Webhook Notification',
    text: JSON.stringify(data, null, 2),
    trackingSettings: {
      clickTracking: {
        enable: false
      }
    }
  };
  // log the message
  console.log('msg', msg);

  try {
    // call SendGrid and log response if needed
    const response = await sgMail.sendMultiple(msg);
    // console.log('success', response[0].statusCode);
    // console.log('success-response',response[0]);

    // send success message
    return {
      statusCode: response[0].statusCode,
      body: JSON.stringify({ message: response[0] }),
    };
  } catch (error) {
    // log error if needed and send error response
    // console.error('error', JSON.stringify(error, 0, 2));
    // const errorMsg = error.response.body.errors[0].message;
    // console.log(errorMsg);

    // send fail message
    return {
      statusCode: error.code,
      body: error.response.body.errors[0].message,
    };
  }
};
