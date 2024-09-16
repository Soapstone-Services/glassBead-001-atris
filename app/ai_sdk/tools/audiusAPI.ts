import fetch from 'node-fetch';

export class AudiusAPI {
  private host: string;
  private appName: string;

  constructor(appName: string) {
    this.appName = appName;
    this.host = '';
  }

  async initialize() {
    try {
      const response = await fetch('https://api.audius.co');
      if (!response.ok) {
        throw new Error(`Audius API host fetch failed: HTTP ${response.status}`);
      }
      const data = await response.json();
      this.host = data.data[0];
    } catch (error) {
      console.error('Error initializing AudiusAPI:', error);
      throw new Error('AudiusAPI initialization failed');
    }
  }

  async search(query: string, limit: number = 10): Promise<any> {
    if (!this.host) {
      await this.initialize();
    }

    const url = new URL(`${this.host}/v1/tracks/search`);
    url.searchParams.append('query', query);
    url.searchParams.append('app_name', this.appName);
    url.searchParams.append('limit', limit.toString());

    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Audius API request failed: HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error in AudiusAPI search:', error);
      throw new Error('Failed to search Audius');
    }
  }
}