import { AudiusAPIBase } from '../base/AudiusAPIBase';
import { Effect } from 'effect';

export class AudiusTracksAPI extends AudiusAPIBase {
  name = "Audius Tracks API";
  description = "Search for tracks on Audius";

  _call(arg: string): Promise<string> {
    return Effect.runPromise(
      Effect.flatMap(
        Effect.promise(() => this.audiusSdk.tracks.searchTracks({ query: arg })),
        result => Effect.succeed(JSON.stringify(result))
      )
    );
  }
}