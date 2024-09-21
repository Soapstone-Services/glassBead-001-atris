import { Effect } from 'effect';
import { AudiusAPI } from '../../ai_sdk/tools';
import { Track } from '../../ai_sdk/tools/audiusTypes';

export const handlePopularTrackQuery = (audiusAPI: AudiusAPI, query: string) => Effect.gen(function* (_) {
  const artistName = query.toLowerCase().split('by').pop()?.split('on')[0]?.trim();
  if (artistName) {
    const tracksResult = yield* _(Effect.tryPromise(() => audiusAPI._call(`track ${artistName}`)));
    const tracks = JSON.parse(tracksResult);
    
    // Sort tracks by play count and get the most popular
    const mostPopularTrack = tracks.data.sort((a: Track, b: Track) => Number(b.playCount) - Number(a.playCount))[0];
    
    return { message: `The most popular track by ${artistName} on Audius is "${mostPopularTrack.title}" with ${mostPopularTrack.playCount} plays.` };
  } else {
    return { message: "I couldn't identify the artist in your query." };
  }
});

export const handleGeneralQuery = (audiusAPI: AudiusAPI, query: string) => Effect.gen(function* (_) {
  const apiResult = yield* _(Effect.tryPromise(() => audiusAPI._call(query)));
  return JSON.parse(apiResult);
});