/**
 * @file FeedPage.ts
 * @description Feed page: shows posts and allows full CRUD (create, edit, delete) for logged-in users.
 */

import postCard from "../components/postCard";
import {
  getAllPosts,
  getPublicPosts,
  createPost,
  updatePost,
  deletePost,
  type NoroffPost,
} from "../services/posts/posts";
import {
  getPostComments,
  createComment,
  toggleReaction,
} from "../services/interactions/interactions";
import { renderRoute } from "../router";
import { isLoggedIn } from "../utils/auth";

export default async function FeedPage(): Promise<string> {
  try {
    const isUserLoggedIn = isLoggedIn();

    // Check for search results from navbar
    const searchQuery = (window as any).searchQuery;
    const searchResults = (window as any).searchResults as NoroffPost[];
    const isSearchMode = Boolean(searchQuery && searchResults);

    let posts: NoroffPost[] = [];
    let postsResponse: any;

    if (isSearchMode) {
      posts = searchResults;
      postsResponse = {
        data: posts,
        meta: {
          currentPage: 1,
          pageCount: 1,
          totalCount: posts.length,
          isFirstPage: true,
          isLastPage: true,
        },
      };
    } else {
      const urlParams = new URLSearchParams(window.location.search);
      const currentPage = parseInt(urlParams.get("page") || "1", 10);
      const postsPerPage = 15;

      try {
        if (isUserLoggedIn) {
          postsResponse = await getAllPosts(postsPerPage, currentPage);
        } else {
          postsResponse = await getPublicPosts(postsPerPage, currentPage);
        }
        posts = postsResponse.data;
      } catch (error) {
        console.log("Failed to load posts:", error);
        posts = [];
        postsResponse = {
          data: [],
          meta: {
            currentPage: 1,
            pageCount: 1,
            totalCount: 0,
            isFirstPage: true,
            isLastPage: true,
          },
        };
      }
    }

    // Initialize event listeners after DOM is rendered
    setTimeout(() => {
      initializeFeedInteractions();
    }, 100);

    return `
      <div class="feed-page">
        <main class="feed-container">
          <!-- Feed Header -->
          <header class="feed-header">
            <h1 class="feed-title">${isUserLoggedIn ? "Your Feed" : "Social Feed"}</h1>
            <p class="feed-subtitle">${
              isUserLoggedIn
                ? `Discover what's happening in your network${
                    !isSearchMode
                      ? ` (Page ${postsResponse.meta.currentPage} of ${postsResponse.meta.pageCount})`
                      : ""
                  }`
                : `Explore public posts and discover interesting content${
                    !isSearchMode
                      ? ` (Page ${postsResponse.meta.currentPage} of ${postsResponse.meta.pageCount})`
                      : ""
                  }`
            }</p>
          </header>

          <!-- Create Post Form (only logged-in users) -->
          ${
            isUserLoggedIn
              ? `
          <section class="create-post-box">
            <h2>Create a Post</h2>
            <form id="create-post-form" class="create-post-form">
              <div class="form-group">
                <label for="post-title">Title</label>
                <input type="text" id="post-title" name="title" placeholder="Enter a title" required />
              </div>
              <div class="form-group">
                <label for="post-body">Body</label>
                <textarea id="post-body" name="body" rows="3" placeholder="What's on your mind?" required></textarea>
              </div>
              <div class="form-group">
                <label for="post-tags">Tags (comma separated)</label>
                <input type="text" id="post-tags" name="tags" placeholder="e.g. nature, coding, life" />
              </div>
              <div class="form-group">
                <label for="post-image-url">Image URL</label>
                <input type="url" id="post-image-url" name="imageUrl" placeholder="https://picsum.photos/600/400" />
              </div>
              <div class="form-group">
                <label for="post-image-alt">Image Alt Text</label>
                <input type="text" id="post-image-alt" name="imageAlt" placeholder="Describe the image" />
              </div>
              <button type="submit" class="btn btn-primary">Post</button>
            </form>
          </section>
          `
              : ""
          }

          <!-- Posts Container -->
          <div class="posts-container" id="posts-container">
            ${
              posts.length > 0
                ? posts
                    .map((post, index) => postCard(post, index * 0.1))
                    .join("")
                : isSearchMode
                  ? renderEmptyState(
                      "🔍",
                      "No posts found",
                      "Try searching with different keywords"
                    )
                  : renderEmptyState(
                      "📭",
                      "No posts available",
                      isUserLoggedIn
                        ? "Start following people to see their posts!"
                        : "No posts to display at the moment. Try refreshing the page.",
                      !isUserLoggedIn
                        ? `<button class="btn btn-primary" onclick="window.location.href='/'" style="margin-top: 1rem;">🔑 Sign In for More Content</button>`
                        : ""
                    )
            }
          </div>

          <!-- Pagination Controls (only show when not in search mode) -->
          ${!isSearchMode ? renderPaginationControls(postsResponse.meta) : ""}
        </main>
      </div>
    `;
  } catch (error) {
    console.error("Error loading feed:", error);
    return renderErrorState();
  }
}

/* -------------------------------------------------------------------------- */
/*                               Helper Functions                             */
/* -------------------------------------------------------------------------- */

function renderEmptyState(
  icon: string,
  title: string,
  message: string,
  extra: string = ""
): string {
  return `
    <div style="text-align: center; padding: 3rem; color: var(--text-muted); background: var(--bg-card); border-radius: var(--border-radius-lg); border: 1px solid var(--border-color);">
      <div style="font-size: 3rem; margin-bottom: 1rem;">${icon}</div>
      <h3>${title}</h3>
      <p>${message}</p>
      ${extra}
    </div>
  `;
}

function renderErrorState(): string {
  return `
    <div class="feed-page">
      <main class="feed-container">
        <div class="error-state">
          <div class="error-icon">⚠️</div>
          <h2>Something went wrong</h2>
          <p>We couldn't load the posts right now. Please try again.</p>
          <button class="retry-btn" onclick="window.location.reload()">Try Again</button>
        </div>
      </main>
    </div>
  `;
}

/* -------------------------------------------------------------------------- */
/*                            Interactions / Events                           */
/* -------------------------------------------------------------------------- */

function initializeFeedInteractions(): void {
  // Handle create post form
  const createForm = document.getElementById(
    "create-post-form"
  ) as HTMLFormElement | null;
  if (createForm) {
    createForm.addEventListener("submit", handleCreatePost);
  }

  // Handle like/reaction buttons
  const likeButtons = document.querySelectorAll(
    ".like-btn, .action-btn-compact.like-btn"
  );
  likeButtons.forEach((button) =>
    button.addEventListener("click", handleLikeClick)
  );

  // Handle comment buttons - toggle visibility
  const commentButtons = document.querySelectorAll(
    ".comment-btn, .action-btn-compact.comment-btn"
  );
  commentButtons.forEach((button) =>
    button.addEventListener("click", handleCommentToggle)
  );

  // Handle view buttons - show full post
  const viewButtons = document.querySelectorAll(
    ".view-btn, .action-btn-compact.view-btn"
  );
  viewButtons.forEach((button) =>
    button.addEventListener("click", handleViewPost)
  );

  // Handle comment form submissions
  const commentSubmitButtons = document.querySelectorAll(".comment-submit-btn");
  commentSubmitButtons.forEach((button) =>
    button.addEventListener("click", handleCommentSubmit)
  );

  // Handle comment input enter key
  const commentInputs = document.querySelectorAll(".comment-input");
  commentInputs.forEach((input) => {
    input.addEventListener("keypress", (event: Event) => {
      const keyEvent = event as KeyboardEvent;
      if (keyEvent.key === "Enter") {
        const postId = (input as HTMLInputElement).id.replace(
          "comment-input-",
          ""
        );
        const submitBtn = document.querySelector(
          `[data-post-id="${postId}"].comment-submit-btn`
        ) as HTMLElement;
        if (submitBtn) {
          handleCommentSubmit({ currentTarget: submitBtn } as unknown as Event);
        }
      }
    });
  });

  // Handle reaction buttons
  const reactionButtons = document.querySelectorAll(".reaction-btn");
  reactionButtons.forEach((button) =>
    button.addEventListener("click", handleReactionClick)
  );

  // Handle like button hover for reactions modal
  likeButtons.forEach((button) => {
    let hoverTimeout: number;
    button.addEventListener("mouseenter", () => {
      hoverTimeout = window.setTimeout(
        () => showReactionsModal(button as HTMLElement),
        800
      );
    });
    button.addEventListener("mouseleave", () => {
      clearTimeout(hoverTimeout);
      hideReactionsModal(button as HTMLElement);
    });
  });

  // Handle delete buttons
  document
    .querySelectorAll(".delete-post-btn")
    .forEach((btn) => btn.addEventListener("click", handleDeletePost));

  // Handle edit buttons
  document
    .querySelectorAll(".edit-post-btn")
    .forEach((btn) => btn.addEventListener("click", handleEditPost));

  // (Removed any "load more" legacy handlers)
}

/* -------------------------------------------------------------------------- */
/*                                Post Create                                 */
/* -------------------------------------------------------------------------- */

async function handleCreatePost(event: Event): Promise<void> {
  event.preventDefault();

  const form = event.target as HTMLFormElement;

  const title = (
    document.getElementById("post-title") as HTMLInputElement
  )?.value.trim();
  const body = (
    document.getElementById("post-body") as HTMLTextAreaElement
  )?.value.trim();
  const rawTags = (
    document.getElementById("post-tags") as HTMLInputElement
  )?.value.trim();
  const tags = rawTags
    ? rawTags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
    : [];

  const imageUrl = (
    document.getElementById("post-image-url") as HTMLInputElement
  )?.value.trim();
  const imageAlt = (
    document.getElementById("post-image-alt") as HTMLInputElement
  )?.value.trim();

  if (!title || !body) {
    alert("Title and Body are required.");
    return;
  }

  try {
    const submitBtn = form.querySelector(
      "button[type='submit']"
    ) as HTMLButtonElement;
    submitBtn.disabled = true;
    submitBtn.textContent = "Posting...";

    const payload: any = { title, body, tags };
    if (imageUrl) payload.media = { url: imageUrl, alt: imageAlt || "image" };

    const created = await createPost(payload);

    // Safety-normalize in UI as well (defensive)
    const safePost: NoroffPost = {
      ...created,
      tags: created.tags || [],
      _count: created._count || { comments: 0, reactions: 0 },
      reactions: created.reactions || [],
    };

    // Insert new post at top
    const postsContainer = document.getElementById("posts-container");
    if (postsContainer) {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = postCard(safePost, 0);
      const el = wrapper.firstElementChild;
      if (el) postsContainer.insertBefore(el, postsContainer.firstChild);
    }

    form.reset();
    submitBtn.disabled = false;
    submitBtn.textContent = "Post";
  } catch (err: any) {
    console.error("Error creating post:", err);
    alert(err?.message || "Failed to create post. Please try again.");
    const submitBtn = form.querySelector(
      "button[type='submit']"
    ) as HTMLButtonElement;
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Post";
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                           Post Delete / Edit                                */
/* -------------------------------------------------------------------------- */

async function handleDeletePost(e: Event) {
  const btn = e.currentTarget as HTMLElement;
  const postId = btn.dataset.postId;
  if (!postId) return;

  if (!confirm("Are you sure you want to delete this post?")) return;

  try {
    await deletePost(Number(postId));
    const postEl = document.getElementById(`post-${postId}`);
    if (postEl) postEl.remove();
  } catch (error) {
    console.error("Error deleting post:", error);
    alert("Failed to delete post.");
  }
}

async function handleEditPost(e: Event) {
  const btn = e.currentTarget as HTMLElement;
  const postId = btn.dataset.postId;
  if (!postId) return;

  const postEl = document.getElementById(`post-${postId}`);
  if (!postEl) return;

  const newTitle = prompt(
    "Edit title:",
    postEl.querySelector(".post-title")?.textContent || ""
  );
  const newBody = prompt(
    "Edit body:",
    postEl.querySelector(".post-body")?.textContent || ""
  );
  if (!newTitle || !newBody) return;

  try {
    const updated = await updatePost(Number(postId), {
      title: newTitle,
      body: newBody,
    });

    const titleEl = postEl.querySelector(".post-title");
    const bodyEl = postEl.querySelector(".post-body");
    if (titleEl) titleEl.textContent = updated.title;
    if (bodyEl) bodyEl.textContent = updated.body;
  } catch (error) {
    console.error("Error updating post:", error);
    alert("Failed to update post.");
  }
}

/* -------------------------------------------------------------------------- */
/*                     Existing comment & reaction handlers                    */
/* -------------------------------------------------------------------------- */

function handleLikeClick(event: Event): void {
  const button = event.currentTarget as HTMLElement;
  const postId = button.dataset.postId;
  button.classList.toggle("liked");
  console.log("Liked post:", postId);
}

async function handleCommentToggle(event: Event): Promise<void> {
  const button = event.currentTarget as HTMLElement;
  const postId = button.dataset.postId;
  if (!postId) return;

  const commentsSection = document.getElementById(`comments-${postId}`);
  if (!commentsSection) return;

  if (
    commentsSection.style.display === "none" ||
    !commentsSection.style.display
  ) {
    try {
      const comments = await getPostComments(postId);
      const commentsList = document.getElementById(`comments-list-${postId}`);

      if (commentsList) {
        commentsList.innerHTML = comments.data
          .map(
            (comment) => `
          <div class="comment-item">
            <div class="comment-author">${comment.author.name}</div>
            <div class="comment-text">${comment.body}</div>
          </div>`
          )
          .join("");
      }

      commentsSection.style.display = "block";
      button.classList.add("active");
    } catch (error) {
      console.error("Error loading comments:", error);
    }
  } else {
    commentsSection.style.display = "none";
    button.classList.remove("active");
  }
}

function handleViewPost(event: Event): void {
  const button = event.currentTarget as HTMLElement;
  const postId = button.dataset.postId;
  console.log("View full post:", postId);
}

async function handleCommentSubmit(event: Event): Promise<void> {
  const button = event.currentTarget as HTMLElement;
  const postId = button.dataset.postId;
  if (!postId) return;

  const commentInput = document.getElementById(
    `comment-input-${postId}`
  ) as HTMLInputElement;
  const commentText = commentInput?.value.trim();
  if (!commentText) return;

  try {
    button.style.opacity = "0.5";
    (button as HTMLButtonElement).disabled = true;

    const response = await createComment(postId, commentText);
    const newComment = response.data;

    const commentsList = document.getElementById(`comments-list-${postId}`);
    if (commentsList) {
      const commentElement = document.createElement("div");
      commentElement.className = "comment-item";
      commentElement.innerHTML = `
        <div class="comment-author">${newComment.author.name}</div>
        <div class="comment-text">${newComment.body}</div>
      `;
      commentsList.appendChild(commentElement);
    }

    // Clear input
    commentInput.value = "";
  } catch (error) {
    console.error("Error creating comment:", error);
    alert("Failed to post comment.");
  } finally {
    button.style.opacity = "1";
    (button as HTMLButtonElement).disabled = false;
  }
}

async function handleReactionClick(event: Event): Promise<void> {
  const button = event.currentTarget as HTMLElement;
  const postId = button.dataset.postId;
  const reaction = button.dataset.reaction;
  if (!postId || !reaction) return;

  try {
    const wasAdded = await toggleReaction(postId, reaction);

    const likeButton = document.querySelector(
      `[data-post-id="${postId}"].like-btn`
    );
    const likeCount = likeButton?.querySelector(".action-count-compact");

    if (likeCount) {
      const currentCount = parseInt(likeCount.textContent || "0", 10);
      likeCount.textContent = wasAdded
        ? (currentCount + 1).toString()
        : Math.max(0, currentCount - 1).toString();
    }

    hideReactionsModal(likeButton as HTMLElement);
  } catch (error) {
    console.error("Error toggling reaction:", error);
  }
}

function showReactionsModal(likeButton: HTMLElement): void {
  const postC = likeButton.closest(".post-card");
  if (!postC) return;
  const postId = likeButton.dataset.postId;
  const reactionsModal = document.getElementById(`reactions-${postId}`);
  if (reactionsModal) reactionsModal.style.display = "block";
}

function hideReactionsModal(likeButton: HTMLElement): void {
  const postC = likeButton.closest(".post-card");
  if (!postC) return;
  const postId = likeButton.dataset.postId;
  const reactionsModal = document.getElementById(`reactions-${postId}`);
  if (reactionsModal) reactionsModal.style.display = "none";
}

/* -------------------------------------------------------------------------- */
/*                          Pagination & Search utils                         */
/* -------------------------------------------------------------------------- */

function renderPaginationControls(meta: any): string {
  if (!meta || meta.pageCount <= 1) return "";

  const currentPage = meta.currentPage;
  const totalPages = meta.pageCount;
  const hasPrev = !meta.isFirstPage;
  const hasNext = !meta.isLastPage;

  return `
    <div class="pagination-container">
      <div class="pagination-info">
        <span class="pagination-text">
          Page ${currentPage} of ${totalPages} (${meta.totalCount} total posts)
        </span>
      </div>
      <div class="pagination-controls">
        ${
          hasPrev
            ? `<button class="pagination-btn pagination-prev" onclick="navigateToPage(${currentPage - 1})">Previous</button>`
            : `<button class="pagination-btn pagination-prev disabled" disabled>Previous</button>`
        }
        ${currentPage !== 1 ? `<button class="pagination-btn pagination-number" onclick="navigateToPage(1)">1</button>` : ""}
        <button class="pagination-btn pagination-number active" disabled>${currentPage}</button>
        ${currentPage !== totalPages ? `<button class="pagination-btn pagination-number" onclick="navigateToPage(${totalPages})">${totalPages}</button>` : ""}
        ${
          hasNext
            ? `<button class="pagination-btn pagination-next" onclick="navigateToPage(${currentPage + 1})">Next</button>`
            : `<button class="pagination-btn pagination-next disabled" disabled>Next</button>`
        }
      </div>
    </div>
  `;
}

(window as any).navigateToPage = function (page: number) {
  const url = new URL(window.location.href);
  url.searchParams.set("page", page.toString());
  history.pushState(
    { path: url.pathname + url.search },
    "",
    url.pathname + url.search
  );
  renderRoute(window.location.pathname);
};

(window as any).clearSearch = function () {
  (window as any).searchQuery = null;
  (window as any).searchResults = null;
  const searchInput = document.getElementById(
    "navbar-search"
  ) as HTMLInputElement;
  if (searchInput) searchInput.value = "";
  renderRoute("/");
};
