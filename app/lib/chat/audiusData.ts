import { Effect } from 'effect';
import { sdk, Track, User, Playlist, TrackArtwork, ProfilePicture, CoverPhoto } from '@audius/sdk';
import { AudiusAPI } from '../../ai_sdk/tools/audius/audiusAPI';

// Export the AudiusData type
export type TrackData = {
  id: string;
  title: string;
  artwork: TrackArtwork;
  description: string | null;
  genre: string;
  mood: string | null;
  releaseDate: string | null;
  remixOf: TrackData | null;
  repostCount: number;
  favoriteCount: number;
  commentCount: number;
  tags: string[] | null;
  user: User;
  duration: number;
  isDownloadable: boolean;
  playCount: number;
  permalink: string;
  isStreamable: boolean;
};

export type ArtistData = {
  id: string;
  name: string;
  handle: string;
  bio: string | null;
  followerCount: number;
  followeeCount: number;
  trackCount: number;
  playlistCount: number;
  albumCount: number;
  isVerified: boolean;
  profilePicture: ProfilePicture;
  coverPhoto: CoverPhoto;
  twitterHandle: string | null;
  instagramHandle: string | null;
  tiktokHandle: string | null;
  website: string | null;
  location: string | null;
  isDeactivated: boolean;
  isAvailable: boolean;
  supporterCount: number;
  supportingCount: number;
  totalAudioBalance: number;
};

export type PlaylistData = {
  id: string;
  playlistName: string;
  creator: string;
  trackCount: number;
  totalPlayCount: number;
  repostCount: number;
  favoriteCount: number;
  isAlbum: boolean;
  description: string | null;
};

export type PopularTrackData = {
  rank: number;
  title: string;
  artist: string;
  playCount: number;
  genre: string;
  mood?: string;
  releaseDate?: string;
};

export type NoMatchData = {
  searchedTrack: string;
  searchedArtist: string;
  availableTracks: Array<{
    title: string;
    artist: string;
    playCount: number;
  }>;
};

export type RemixData = {
  id: string;
  title: string;
  artist: string;
  remixOf: TrackData;
};

export type GenreData = {
  genre: string;
  tracks: Array<{
    id: string;
    title: string;
    artist: string;
    artwork: TrackArtwork;
    duration: number;
    playCount: number;
    favoriteCount: number;
    repostCount: number;
    releaseDate: string | null;
    permalink: string;
  }>;
};

export type AudiusData = 
  | { type: 'track'; data: Track }
  | { type: 'artist'; data: User }
  | { type: 'playlist'; data: Playlist }
  | { type: 'popularTrack'; data: PopularTrackData }
  | { type: 'noMatch'; data: NoMatchData }
  | { type: 'remix'; data: RemixData }
  | { type: 'genre'; data: GenreData };

// Define each of these types (TrackData, ArtistData, etc.) with their specific properties

if (!process.env.AUDIUS_API_KEY || !process.env.AUDIUS_API_SECRET) {
  throw new Error('Audius API key or secret is not defined in the environment variables.');
}

const apiKey = process.env.AUDIUS_API_KEY!;
const apiSecret = process.env.AUDIUS_API_SECRET!;

const audiusSdk = sdk({
  appName: 'audius-ai-sdk', // Replace with your actual app name
  apiKey: apiKey,
  apiSecret: apiSecret,
});

export async function fetchAudiusData(query: string): Promise<AudiusData | null> {
  try {
    const trackMatch = query.match(/track\s+(\S+)/i);
    if (trackMatch) {
      const trackName = trackMatch[1];
      const { data } = await audiusSdk.tracks.searchTracks({ query: trackName });
      if (data && data.length > 0) {
        const track = data[0];
        return {
          type: 'track',
          data: track
        };
      }
    }

    const artistMatch = query.match(/artist\s+(\S+)/i);
    if (artistMatch) {
      const artistName = artistMatch[1];
      const { data } = await audiusSdk.users.searchUsers({ query: artistName });
      if (data && data.length > 0) {
        const artist = data[0];
        return {
          type: 'artist',
          data: artist
        };
      }
    }

    const playlistMatch = query.match(/playlist\s+(\S+)/i);
    if (playlistMatch) {
      const playlistName = playlistMatch[1];
      const { data } = await audiusSdk.playlists.searchPlaylists({ query: playlistName });
      if (data && data.length > 0) {
        const playlist = data[0];
        return {
          type: 'playlist',
          data: playlist
        };
      }
    }

    // For remixes and genres, we might need to do some additional processing
    // as the SDK might not have direct methods for these.

    return null;
  } catch (error) {
    console.error("Error fetching Audius data:", error);
    return null;
  }
}

async function searchRemixes(query: string): Promise<AudiusData | null> {
  try {
    // Search for tracks that might be remixes
    const { data } = await audiusSdk.tracks.searchTracks({ query });
    
    // Filter for tracks that are remixes
    const remixes = data!.filter(track => track.remixOf !== null);
    
    if (remixes.length > 0) {
      const remix = remixes[0];
      
      // Fetch original track details
      const originalTrackId = remix.remixOf!.tracks![0].parentTrackId;
      const originalTrack = await audiusSdk.tracks.getTrack({ trackId: originalTrackId });
      
      return {
        type: 'remix',
        data: {
          id: remix.id,
          title: remix.title,
          artist: remix.user.name,
          remixOf: {
            id: originalTrack!.data!.id,
            title: originalTrack!.data!.title,
            artwork: originalTrack!.data!.artwork,
            description: originalTrack!.data!.description || null,
            genre: originalTrack!.data!.genre,
            mood: originalTrack!.data!.mood || null,
            releaseDate: originalTrack!.data!.releaseDate || null,
            remixOf: null,
            repostCount: originalTrack!.data!.repostCount,
            favoriteCount: originalTrack!.data!.favoriteCount,
            commentCount: originalTrack!.data!.commentCount,
            tags: Array.isArray(originalTrack!.data!.tags) ? originalTrack!.data!.tags : null,
            user: originalTrack!.data!.user,
            duration: originalTrack!.data!.duration,
            isDownloadable: originalTrack!.data!.isDownloadable,
            playCount: originalTrack!.data!.playCount,
            permalink: originalTrack!.data!.permalink,
            isStreamable: originalTrack!.data!.isStreamable || false
          }
        }
      };
    }
    return null;
  } catch (error) {
    console.error("Error searching for remixes:", error);
    return null;
  }
}