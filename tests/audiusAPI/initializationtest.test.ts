import { AudiusAPI } from '../../app/ai_sdk/tools/audius/audiusAPI';

describe('AudiusAPI Initialization', () => {
  it('should initialize AudiusAPI without errors', () => {
    expect(() => new AudiusAPI()).not.toThrow();
  });

  it('should have correct name and description', () => {
    const audiusAPI = new AudiusAPI();
    expect(audiusAPI.name).toBe('Audius API');
    expect(audiusAPI.description).toBe('Search for users, tracks, and playlists on Audius');
  });
});
