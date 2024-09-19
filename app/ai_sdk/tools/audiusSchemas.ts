import { z } from 'zod';

export const TrackSearchParamsSchema = z.object({
  query: z.string().min(1),
  only_downloadable: z.boolean().optional(),
  tags: z.string().optional(),
  genre: z.string().optional(),
  user_id: z.number().int().positive().optional(),
});

export const UserSearchParamsSchema = z.object({
  query: z.string().min(1),
  // Add any other user-specific search parameters here
});

export const PlaylistSearchParamsSchema = z.object({
  query: z.string().min(1),
  // Add any other playlist-specific search parameters here
});

// You can also export types derived from these schemas
export type TrackSearchParameters = z.infer<typeof TrackSearchParamsSchema>;
export type UserSearchParameters = z.infer<typeof UserSearchParamsSchema>;
export type PlaylistSearchParameters = z.infer<typeof PlaylistSearchParamsSchema>;