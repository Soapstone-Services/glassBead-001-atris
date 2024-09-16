// Basic types used across multiple entities
type UserID = number;
type TrackID = number;
type PlaylistID = number;

// User interface
export interface User {
  album_count: number;
  bio: string | null;
  cover_photo: {
    '640x': string;
    '2000x': string;
  };
  followee_count: number;
  follower_count: number;
  handle: string;
  id: UserID;
  is_verified: boolean;
  location: string | null;
  name: string;
  playlist_count: number;
  profile_picture: {
    '150x150': string;
    '480x480': string;
    '1000x1000': string;
  };
  repost_count: number;
  track_count: number;
}

// Track interface
export interface Track {
  artwork: {
    '150x150': string;
    '480x480': string;
    '1000x1000': string;
  };
  description: string | null;
  genre: string;
  id: TrackID;
  mood: string | null;
  release_date: string;
  repost_count: number;
  favorite_count: number;
  tags: string | null;
  title: string;
  user: User;
  duration: number;
  downloadable: boolean;
  play_count: number;
}

// Playlist interface
export interface Playlist {
  artwork: {
    '150x150': string;
    '480x480': string;
    '1000x1000': string;
  };
  description: string | null;
  id: PlaylistID;
  is_album: boolean;
  playlist_name: string;
  repost_count: number;
  favorite_count: number;
  total_play_count: number;
  user: User;
}

// Search parameters interfaces
export interface SearchParameters {
  query: string;
  only_downloadable?: boolean;
}

export interface TrackSearchParameters extends SearchParameters {
  tags?: string;
  genre?: string;
  user_id?: UserID;
}

export interface UserSearchParameters extends SearchParameters {
  only_verified?: boolean;
}

export interface PlaylistSearchParameters extends SearchParameters {
  user_id?: UserID;
}

// API response interfaces
export interface APIResponse<T> {
  data: T[];
}

export interface SearchResponse<T> extends APIResponse<T> {
  next_offset?: number;
}