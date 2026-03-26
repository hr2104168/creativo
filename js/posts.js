/* =============================================
   posts.js — Creativo
   Handles: create, delete, like, comment
   Depends on: storage.js loaded first
   ============================================= */


/* ── STORAGE HELPERS ─────────────────────────
   These extend storage.js with post-specific
   CRUD that the team hasn't written yet.
   ─────────────────────────────────────────── */

function getPostById(id) {
  return getPosts().find(function(p) { return p.id === id; }) || null;
}

function savePost(post) {
  var posts = getPosts();
  var index = posts.findIndex(function(p) { return p.id === post.id; });
  if (index !== -1) {
    posts[index] = post;
  } else {
    posts.unshift(post);
  }
  savePosts(posts);
}


/* ── CREATE POST ─────────────────────────── */

function createPost(authorId, content) {
  var post = {
    id:        generateId('p'),
    authorId:  authorId,
    content:   content.trim(),
    likes:     [],
    comments:  [],
    createdAt: new Date().toISOString()
  };
  var posts = getPosts();
  posts.unshift(post);
  savePosts(posts);
  return post;
}


/* ── DELETE POST ─────────────────────────── */

function deletePost(postId) {
  var posts = getPosts().filter(function(p) { return p.id !== postId; });
  savePosts(posts);
}


/* ── LIKE / UNLIKE ───────────────────────── */

function likePost(postId, userId) {
  var post = getPostById(postId);
  if (!post) return;
  if (!post.likes.includes(userId)) {
    post.likes.push(userId);
    savePost(post);
  }
}

function unlikePost(postId, userId) {
  var post = getPostById(postId);
  if (!post) return;
  post.likes = post.likes.filter(function(id) { return id !== userId; });
  savePost(post);
}


/* ── COMMENTS ────────────────────────────── */

function addComment(postId, authorId, text) {
  var post = getPostById(postId);
  if (!post) return;
  var comment = {
    id:        generateId('c'),
    authorId:  authorId,
    text:      text.trim(),
    createdAt: new Date().toISOString()
  };
  post.comments.push(comment);
  savePost(post);
  return comment;
}

function deleteComment(postId, commentId) {
  var post = getPostById(postId);
  if (!post) return;
  post.comments = post.comments.filter(function(c) { return c.id !== commentId; });
  savePost(post);
}


/* ── TIME HELPER ─────────────────────────── */

function timeAgo(isoString) {
  var diff = Math.floor((Date.now() - new Date(isoString)) / 1000);
  if (diff < 60)     return 'just now';
  if (diff < 3600)   return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400)  return Math.floor(diff / 3600) + 'h ago';
  if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
  return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}


/* ── AVATAR HELPER ───────────────────────── */

function getAvatarHtml(user, size) {
  size = size || 44;
  if (user.profilePicture) {
    return '<img src="' + user.profilePicture + '" alt="' + user.username + '" '
      + 'style="width:' + size + 'px;height:' + size + 'px;border-radius:50%;object-fit:cover;" '
      + 'onerror="this.style.display=\'none\';this.nextSibling.style.display=\'flex\'">'
      + '<div class="avatar-fallback" style="width:' + size + 'px;height:' + size + 'px;display:none">'
      + user.username.charAt(0).toUpperCase() + '</div>';
  }
  var colors = ['#7F77DD','#AFA9EC','#3C3489','#D4A8D8'];
  var color  = colors[user.username.charCodeAt(0) % colors.length];
  return '<div class="avatar-fallback" style="width:' + size + 'px;height:' + size + 'px;background:' + color + '">'
    + user.username.charAt(0).toUpperCase() + '</div>';
}


/* ── RENDER A SINGLE POST CARD ───────────── */

function renderPostCard(post, currentUser) {
  var author   = getUserById(post.authorId);
  if (!author) return '';

  var isOwner  = post.authorId === currentUser.id;
  var isLiked  = post.likes.includes(currentUser.id);
  var likeCount    = post.likes.length;
  var commentCount = post.comments.length;

  /* comments HTML */
  var commentsHtml = post.comments.map(function(c) {
    var cAuthor = getUserById(c.authorId);
    if (!cAuthor) return '';
    var canDelete = c.authorId === currentUser.id;
    return '<div class="comment" data-comment-id="' + c.id + '">'
      + '<div class="comment-avatar">' + getAvatarHtml(cAuthor, 28) + '</div>'
      + '<div class="comment-body">'
      + '<span class="comment-author">' + escapeHtml(cAuthor.username) + '</span>'
      + '<span class="comment-text">' + escapeHtml(c.text) + '</span>'
      + '<span class="comment-time">' + timeAgo(c.createdAt) + '</span>'
      + '</div>'
      + (canDelete
          ? '<button class="comment-delete-btn" data-post-id="' + post.id + '" data-comment-id="' + c.id + '" title="Delete comment">✕</button>'
          : '')
      + '</div>';
  }).join('');

  return '<div class="post-card" data-post-id="' + post.id + '">'

    /* header */
    + '<div class="post-header">'
    + '<div class="post-avatar">' + getAvatarHtml(author, 44) + '</div>'
    + '<div class="post-author-info">'
    + '<div class="post-author-name">' + escapeHtml(author.username) + '</div>'
    + '<div class="post-time">' + timeAgo(post.createdAt) + '</div>'
    + '</div>'
    + (isOwner
        ? '<button class="action-btn delete-btn" data-post-id="' + post.id + '" title="Delete post">🗑</button>'
        : '')
    + '</div>'

    /* content */
    + '<div class="post-content">' + escapeHtml(post.content) + '</div>'

    /* action bar */
    + '<div class="post-actions">'
    + '<button class="action-btn like-btn' + (isLiked ? ' liked' : '') + '" data-post-id="' + post.id + '">'
    + (isLiked ? '❤️' : '🤍') + ' <span class="like-count">' + likeCount + '</span>'
    + '</button>'
    + '<button class="action-btn comment-toggle-btn" data-post-id="' + post.id + '">'
    + '💬 <span>' + commentCount + '</span>'
    + '</button>'
    + '</div>'

    /* comments section */
    + '<div class="comments-section" id="comments-' + post.id + '" style="display:none">'
    + '<div class="comments-list">'
    + (commentsHtml || '<p class="no-comments">No comments yet.</p>')
    + '</div>'
    + '<div class="comment-form">'
    + '<div class="comment-avatar">' + getAvatarHtml(currentUser, 28) + '</div>'
    + '<input type="text" class="comment-input" data-post-id="' + post.id + '" placeholder="Write a comment…" maxlength="300">'
    + '<button class="comment-submit-btn" data-post-id="' + post.id + '">Post</button>'
    + '</div>'
    + '</div>'

    + '</div>';
}


/* ── RENDER A LIST OF POSTS ──────────────── */

function renderPosts(posts, currentUser, containerId) {
  var container = document.getElementById(containerId);
  if (!container) return;

  if (!posts || posts.length === 0) {
    container.innerHTML = '<div class="empty-posts">'
      + '<p style="font-size:2rem;margin-bottom:8px">✨</p>'
      + '<p>No posts yet. Be the first to share!</p>'
      + '</div>';
    return;
  }

  container.innerHTML = posts.map(function(post) {
    return renderPostCard(post, currentUser);
  }).join('');
}


/* ── EVENT DELEGATION ────────────────────── */
/* Attach this once to a parent container    */

function attachPostEvents(containerId, onUpdate) {
  var container = document.getElementById(containerId);
  if (!container) return;

  container.addEventListener('click', function(e) {
    var currentUser = getLoggedInUser();
    if (!currentUser) return;

    /* ── Like button ── */
    var likeBtn = e.target.closest('.like-btn');
    if (likeBtn) {
      var postId  = likeBtn.dataset.postId;
      var post    = getPostById(postId);
      var isLiked = post.likes.includes(currentUser.id);
      if (isLiked) {
        unlikePost(postId, currentUser.id);
      } else {
        likePost(postId, currentUser.id);
      }
      if (onUpdate) onUpdate();
      return;
    }

    /* ── Comment toggle ── */
    var toggleBtn = e.target.closest('.comment-toggle-btn');
    if (toggleBtn) {
      var postId  = toggleBtn.dataset.postId;
      var section = document.getElementById('comments-' + postId);
      if (section) {
        var isOpen = section.style.display !== 'none';
        section.style.display = isOpen ? 'none' : 'block';
        if (!isOpen) section.querySelector('.comment-input').focus();
      }
      return;
    }

    /* ── Submit comment button ── */
    var submitBtn = e.target.closest('.comment-submit-btn');
    if (submitBtn) {
      var postId = submitBtn.dataset.postId;
      var input  = container.querySelector('.comment-input[data-post-id="' + postId + '"]');
      if (input && input.value.trim()) {
        addComment(postId, currentUser.id, input.value);
        input.value = '';
        if (onUpdate) onUpdate();
      }
      return;
    }

    /* ── Delete comment ── */
    var commentDeleteBtn = e.target.closest('.comment-delete-btn');
    if (commentDeleteBtn) {
      var postId    = commentDeleteBtn.dataset.postId;
      var commentId = commentDeleteBtn.dataset.commentId;
      if (confirm('Delete this comment?')) {
        deleteComment(postId, commentId);
        if (onUpdate) onUpdate();
      }
      return;
    }

    /* ── Delete post ── */
    var deleteBtn = e.target.closest('.delete-btn');
    if (deleteBtn) {
      var postId = deleteBtn.dataset.postId;
      if (confirm('Delete this post? This cannot be undone.')) {
        deletePost(postId);
        if (onUpdate) onUpdate();
      }
      return;
    }
  });

  /* Submit comment on Enter key */
  container.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.target.classList.contains('comment-input')) {
      e.preventDefault();
      var postId    = e.target.dataset.postId;
      var submitBtn = container.querySelector('.comment-submit-btn[data-post-id="' + postId + '"]');
      if (submitBtn) submitBtn.click();
    }
  });
}


/* ── XSS PROTECTION ──────────────────────── */

function escapeHtml(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}