import { get, post, put, del } from "../api/client";

export interface Comment {
  id: string;
  body: string;
  replyToId?: string | null;
  postId: string;
  owner: string;
  created: string;
  author: {
    name: string;
    email: string;
    avatar?: {
      url: string;
      alt: string;
    } | null;
  };
}

export interface Reaction {
  symbol: string;
  count: number;
}

export interface CommentsResponse {
  data: Comment[];
  meta: {
    isFirstPage: boolean;
    isLastPage: boolean;
    currentPage: number;
    previousPage: number | null;
    nextPage: number | null;
    pageCount: number;
    totalCount: number;
  };
}

/**
 * Get comments for a specific post
 */
export async function getPostComments(
  postId: string,
  page: number = 1,
  limit: number = 12
): Promise<CommentsResponse> {
  return get<CommentsResponse>(
    `/social/posts/${postId}/comments?page=${page}&limit=${limit}&_author=true`
  );
}

/**
 * Create a new comment on a post
 */
export async function createComment(
  postId: string,
  body: string,
  replyToId?: string
): Promise<{ data: Comment }> {
  const commentData: any = { body };
  if (replyToId) {
    commentData.replyToId = replyToId;
  }

  const response = await post(`/social/posts/${postId}/comment`, commentData);
  return response as any as { data: Comment };
}

/**
 * React to a post with an emoji
 */
export async function reactToPost(
  postId: string,
  symbol: string
): Promise<void> {
  await put(`/social/posts/${postId}/react/${encodeURIComponent(symbol)}`, {});
}

/**
 * Remove reaction from a post
 */
export async function removeReaction(
  postId: string,
  symbol: string
): Promise<void> {
  await del(`/social/posts/${postId}/react/${encodeURIComponent(symbol)}`);
}

/**
 * Toggle reaction on a post (add if not exists, remove if exists)
 */
export async function toggleReaction(
  postId: string,
  symbol: string
): Promise<boolean> {
  try {
    await reactToPost(postId, symbol);
    return true;
  } catch (error: any) {
    // If already reacted, remove it instead
    if (error.response?.status === 400 || error.response?.status === 409) {
      await removeReaction(postId, symbol);
      return false;
    }
    throw error;
  }
}

/**
 * Delete a comment (only works for your own comments)
 */
export async function deleteComment(
  postId: string,
  commentId: string
): Promise<void> {
  await del(`/social/posts/${postId}/comment/${commentId}`);
}

/**
 * Utility: Get time ago text for a date
 */
export function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInSeconds < 60) return "now";
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  if (diffInHours < 24) return `${diffInHours}h`;
  if (diffInDays < 7) return `${diffInDays}d`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: diffInDays > 365 ? "numeric" : undefined,
  });
}
