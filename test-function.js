// Test the Netlify function locally
const { handler } = require('./netlify/functions/api.js');

async function test() {
  console.log('Testing Netlify function...\n');
  
  // Simulate a Netlify event
  const event = {
    httpMethod: 'GET',
    path: '/api/health',
    headers: {},
    queryStringParameters: {},
    body: null,
    isBase64Encoded: false
  };
  
  const context = {
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'api',
    functionVersion: '$LATEST',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:api',
    memoryLimitInMB: '1024',
    awsRequestId: 'test-request-id',
    logGroupName: '/aws/lambda/api',
    logStreamName: '2024/01/01/[$LATEST]test',
    getRemainingTimeInMillis: () => 30000,
    done: () => {},
    fail: () => {},
    succeed: () => {}
  };
  
  try {
    console.log('Initializing function...');
    const result = await handler(event, context);
    console.log('\n✅ Function executed successfully!');
    console.log('Status:', result.statusCode);
    console.log('Response:', result.body ? JSON.parse(result.body) : 'No body');
  } catch (error) {
    console.error('\n❌ Function failed:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

test();
