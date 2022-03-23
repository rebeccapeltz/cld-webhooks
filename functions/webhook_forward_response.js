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
  // expect a URL string
  const dataURL = JSON.parse(event.body);
  console.log(JSON.stringify(dataURL, null, 2));
  console.log(JSON.stringify(dataURL.url, null, 2));

  const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
      'Origin, X-Requested-With, Content-Type, Accept',
  }

  try {

  
    const response = await axios({
      method: 'get',
      url: axios({
        method: 'get',
        headers: CORS_HEADERS,
        url: dataURL.url
      }),
    });
    console.log(response);
    // send success message
    return {
      statusCode: 200,
      body: JSON.stringify({ message: response })
    };
  } catch (error) {
    // send fail message
    return {
      statusCode: error.code,
      body: `Error fetching ${dataURL}`
    };
  }
};
