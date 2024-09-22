import { Tool } from "langchain/tools";
import { sdk } from '@audius/sdk';

export abstract class AudiusAPIBase extends Tool {
  protected audiusSdk: ReturnType<typeof sdk>;

  constructor(apiKey: string, apiSecret: string) {
    super();
    this.audiusSdk = sdk({ apiKey, apiSecret });
  }

  abstract _call(arg: string): Promise<string>;
}