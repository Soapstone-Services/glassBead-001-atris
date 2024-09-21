import { AudiusAPI } from '../../app/ai_sdk/tools/audius/audiusAPI';

describe('AudiusAPI Integration Tests', () => {
  let audiusAPI: AudiusAPI;

  beforeEach(() => {
    audiusAPI = new AudiusAPI();
  });

  it('should search for users', async () => {
    const result = await audiusAPI._call('search for user John');
    expect(JSON.parse(result)).toEqual(expect.arrayContaining([
      expect.objectContaining({
        name: expect.stringContaining('John')
      })
    ]));
  });

  it('should search for tracks', async () => {
    const result = await audiusAPI._call('search for track Hello');
    expect(JSON.parse(result)).toEqual(expect.arrayContaining([
      expect.objectContaining({
        title: expect.stringContaining('Hello')
      })
    ]));
  });

  it('should search for playlists', async () => {
    const result = await audiusAPI._call('search for playlist Summer');
    expect(JSON.parse(result)).toEqual(expect.arrayContaining([
      expect.objectContaining({
        playlist_name: expect.stringContaining('Summer')
      })
    ]));
  });

  it('should get track play count', async () => {
    const playCount = await audiusAPI.getTrackPlayCount('Known Track', 'Known Artist');
    expect(typeof playCount).toBe('number');
    expect(playCount).toBeGreaterThan(0);
  });

  it('should throw error for non-existent track', async () => {
    await expect(audiusAPI.getTrackPlayCount('Non-existent Track', 'Unknown Artist'))
      .rejects.toThrow('Track "Non-existent Track" by Unknown Artist not found');
  });
});