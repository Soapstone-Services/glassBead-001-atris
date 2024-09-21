import { Track as SDKTrack, User as SDKUser, Playlist as SDKPlaylist } from '@audius/sdk';

// Re-export the types from the SDK
export type User = SDKUser;
export type Playlist = SDKPlaylist;

// Keep or modify the SearchResponse type as needed
export interface SearchResponse<T> {
  data: T[];
  next_offset?: number;
}

// You may want to keep these if they're still used in your project
export type UserID = number;
export type TrackID = number;
export type PlaylistID = number;

// Keep these if you're still using them, or remove if not needed
export interface SearchParameters {
  query: string;
}

export interface TrackSearchParameters extends SearchParameters {
  // Add any additional parameters specific to track search
}

export interface UserSearchParameters extends SearchParameters {
  // Add any additional parameters specific to user search
}

export interface PlaylistSearchParameters extends SearchParameters {
  // Add any additional parameters specific to playlist search
}

export interface ExtendedTrack extends SDKTrack {
  // Add any additional properties here
  customProperty?: string;
}

export type Track = ExtendedTrack;