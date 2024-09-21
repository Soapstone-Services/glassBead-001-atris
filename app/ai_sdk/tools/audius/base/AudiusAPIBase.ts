import { Tool } from "langchain/tools";
import { sdk, AudiusSdk } from '@audius/sdk';

export abstract class AudiusAPIBase extends Tool {
  protected audiusSdk: AudiusSdk;

  constructor() {
    super();
    this.audiusSdk = sdk({ appName: 'YourAppName' });
  }

  abstract _call(arg: string): Promise<string>;
}