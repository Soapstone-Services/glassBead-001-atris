import { Effect } from 'effect';
import { AudiusAPI } from '../../ai_sdk/tools';
import * as handlers from './queryHandlers';

const queryHandlers = [
  { pattern: /popular.*track.*by/i, handler: handlers.handlePopularTrackQuery },
  // Add more handlers here as needed
];

export const routeQuery = (audiusAPI: AudiusAPI, query: string) => Effect.gen(function* (_) {
  // Check specific handlers first
  for (const { pattern, handler } of queryHandlers) {
    if (pattern.test(query)) {
      return yield* _(handler(audiusAPI, query));
    }
  }
  
  // Default case: use the general query handler
  return yield* _(handlers.handleGeneralQuery(audiusAPI, query));
});