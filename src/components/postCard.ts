/**
 * Instagram-like post card component
 * @param post Post object
 * @param animationDelay Animation delay in seconds (for animate.css) - use the index
 */

import type { NoroffPost } from "../services/posts/posts";

/**
 * Creates a compact post card HTML for grid layout
 * @param post The post data from Noroff API
 * @param animationDelay Animation delay in seconds
 * @returns HTML string for the compact post card
 */
export default function postCard(
  post: NoroffPost,
  animationDelay: number = 0
): string {
  const {
    id,
    title = "",
    body = "",
    tags = [],
    media,
    created,
    author = { name: "Unknown", email: "unknown@mail.com" },
    _count = { comments: 0, reactions: 0 },
    reactions = [],
  } = post;

  // Fallback avatar
  const avatarUrl =
    author?.avatar?.url || "https://via.placeholder.com/50?text=U";
  const avatarAlt = author?.avatar?.alt || author?.name || "User";

  // Format the date
  const createdDate = created ? new Date(created) : new Date();
  const timeAgo = getTimeAgo(createdDate);

  // Reaction count
  const reactionCount =
    reactions.reduce((total, reaction) => total + reaction.count, 0) || 0;

  // Truncate text
  const truncatedBody = body.length > 80 ? body.substring(0, 80) + "..." : body;
  const truncatedTitle =
    title.length > 40 ? title.substring(0, 40) + "..." : title;

  return `
    <article class="post-card" data-post-id="${id}" style="animation-delay: ${animationDelay}s">
      ${
        media?.url
          ? `
        <div class="post-media-preview">
          <img src="${media.url}" alt="${media.alt || "Post image"}" class="post-image-preview">
        </div>
      `
          : ""
      }

      <header class="post-header-compact">
        <div class="author-info-compact">
          <div class="author-avatar-small">
            <img src="${avatarUrl}" alt="${avatarAlt}" class="avatar-img-small">
          </div>
          <div class="author-details-compact">
            <h4 class="author-name-compact">${author?.name || "Unknown"}</h4>
            <p class="post-time-compact">${timeAgo}</p>
          </div>
        </div>
      </header>

      <div class="post-content-compact">
        ${truncatedTitle ? `<h3 class="post-title-compact">${truncatedTitle}</h3>` : ""}
        <div class="post-text-compact"><p>${truncatedBody}</p></div>
        ${
          tags.length > 0
            ? `<div class="post-tags-compact">
                ${tags
                  .slice(0, 2)
                  .map((tag) => `<span class="tag-compact">#${tag}</span>`)
                  .join("")}
                ${
                  tags.length > 2
                    ? `<span class="tag-more">+${tags.length - 2}</span>`
                    : ""
                }
              </div>`
            : ""
        }
      </div>

      <footer class="post-actions-compact">
        <div class="action-buttons-compact">
          <button class="action-btn-compact like-btn" data-post-id="${id}">
            ❤️ <span class="action-count-compact">${reactionCount}</span>
          </button>
          <button class="action-btn-compact comment-btn" data-post-id="${id}">
            💬 <span class="action-count-compact">${_count.comments}</span>
          </button>
          <button class="action-btn-compact view-btn" data-post-id="${id}">
            👁
          </button>
        </div>
      </footer>

      <div class="comments-section" id="comments-${id}" style="display: none;">
        <div class="comments-list" id="comments-list-${id}"></div>
        <div class="comment-form">
          <div class="comment-input-container">
            <input type="text" id="comment-input-${id}" class="comment-input" placeholder="Write a comment..." maxlength="280">
            <button class="comment-submit-btn" data-post-id="${id}">➤</button>
          </div>
        </div>
      </div>

      <div class="reactions-modal" id="reactions-${id}" style="display: none;">
        <div class="reactions-list">
          ${["👍", "❤️", "😂", "😮", "😢", "😡"]
            .map(
              (emoji) =>
                `<button class="reaction-btn" data-reaction="${emoji}" data-post-id="${id}">${emoji}</button>`
            )
            .join("")}
        </div>
      </div>
    </article>
  `;
}

/**
 * Calculate time ago from a date
 * @param date The date to calculate from
 * @returns Formatted time ago string
 */
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInSeconds < 60) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString();
}
