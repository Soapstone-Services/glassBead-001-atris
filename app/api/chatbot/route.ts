import { AudiusAPI } from '../../ai_sdk/tools/audius/audiusAPI';
import { Effect, pipe } from 'effect';
import { routeQuery } from './queryRouter';

export async function POST(req: Request) {
  console.log('Received POST request to /api/chatbot');

  // Helper function to safely get environment variables
  const getEnvVariable = (key: string) =>
    Effect.fromNullable(process.env[key])
      .pipe(Effect.mapError(() => new Error(`${key} is not set`)));

  // Initialize the Audius API with credentials from environment variables
  const initializeAudiusAPI = Effect.gen(function* (_) {
    const apiKey = yield* _(getEnvVariable('AUDIUS_API_KEY'));
    const apiSecret = yield* _(getEnvVariable('AUDIUS_API_SECRET'));
    return new AudiusAPI(apiKey, apiSecret);
  });

  // Main function to handle the chatbot request
  const handleChatbotRequest = (audiusAPI: AudiusAPI) => Effect.gen(function* (_) {
    console.log('Entering handleChatbotRequest');
    
    // Parse the request body
    const body = yield* _(Effect.tryPromise(() => req.json()));
    console.log('Parsed request body:', body);
    
    // Extract query from either 'query' or 'message' field
    const query = body.query || body.message;
    
    if (typeof query !== 'string') {
      console.log('Invalid or missing query in request body');
      return new Response(JSON.stringify({ error: 'Invalid or missing query in request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    console.log('Extracted query:', query);

    // Process the user's query using the query router
    const result = yield* _(routeQuery(audiusAPI, query));

    console.log('Response content:', result);
    console.log('Returning response');
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  });

  // Compose the program using the Effect API
  const program = pipe(
    initializeAudiusAPI,
    Effect.flatMap(handleChatbotRequest),
    Effect.catchAll((error: unknown) => Effect.sync(() => {
      console.error('Error in chatbot program:', error);
      let errorMessage = 'Internal Server Error';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      return new Response(JSON.stringify({ error: errorMessage }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }))
  );

  // Run the program and return the result
  return Effect.runPromise(program);
}