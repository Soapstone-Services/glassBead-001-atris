console.log('Test file is being executed');

// Import the AudiusAPI class from the implementation file
import { AudiusAPI } from '../app/ai_sdk/tools/audiusAPI';

console.log('AudiusAPI imported successfully');

async function testAudiusAPI() {
  console.log('Creating AudiusAPI instance...');
  // Create a new instance of AudiusAPI with a test app name
  const audiusAPI = new AudiusAPI('audius-chatbot-dos');
  console.log('AudiusAPI instance created');

  try {
    console.log('Initializing AudiusAPI...');
    // Call the initialize method to set up the API host
    await audiusAPI.initialize();
    console.log('AudiusAPI initialized');

    console.log('Calling AudiusAPI search method...');
    // Test the search method instead of _call
    const result = await audiusAPI.search('electronic music');
    console.log('AudiusAPI search result:', result);
  } catch (error) {
    // Log any errors that occur during the test
    console.error('Error during AudiusAPI test:', error);
  }
}

// Execute the test function and handle any unhandled promise rejections
testAudiusAPI().then(() => {
  console.log('Test file execution complete');
}).catch((error) => {
  console.error('Unhandled error in test execution:', error);
});