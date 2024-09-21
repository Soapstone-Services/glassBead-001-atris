import { AudiusAPIBase } from '../base/AudiusAPIBase';
import { Effect } from 'effect';

export class AudiusUsersAPI extends AudiusAPIBase {
  name = "Audius Users API";
  
  description = "Search for users on Audius";

  _call(arg: string): Promise<string> {
    return Effect.runPromise(
      Effect.flatMap(
        Effect.promise(() => this.audiusSdk.users.searchUsers({ query: arg })),
        result => Effect.succeed(JSON.stringify(result))
      )
    );
  }
}