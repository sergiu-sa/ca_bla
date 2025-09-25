/**
 * @file types/noroff-types.ts
 * @description Defines TypeScript interfaces for User and Post entities in the social media application.
 * @note This code is taken from a boiler-plate created by Monde Sineke.
 * @author Your Name
 */

export interface Post {
  id: string;
  content: string;
  author: string;
  timestamp: Date;
  likes: number;
  likedBy: Set<string>;
}
