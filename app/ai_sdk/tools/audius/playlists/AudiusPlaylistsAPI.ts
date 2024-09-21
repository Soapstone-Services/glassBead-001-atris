import { AudiusAPIBase } from '../base/AudiusAPIBase';
import { Effect } from 'effect';

export class AudiusPlaylistsAPI extends AudiusAPIBase {
  name = "Audius Playlists API";
  description = "Search for playlists on Audius";

  _call(arg: string): Promise<string> {
    return Effect.runPromise(
      Effect.flatMap(
        Effect.promise(() => this.audiusSdk.playlists.searchPlaylists({ query: arg })),
        result => Effect.succeed(JSON.stringify(result))
      )
    );
  }
}