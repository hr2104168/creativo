// STORAGE HELPERS
const Storage = {
  get(key) {
    try { return JSON.parse(localStorage.getItem(key)); }
    catch { return null; }
  },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); },
  getUsers() { return this.get('creativo_users') || []; },
  setUsers(u) { this.set('creativo_users', u); },
  getPosts() { return this.get('creativo_posts') || []; },
  setPosts(p) { this.set('creativo_posts', p); },
  getCurrentUser() {
    const id = localStorage.getItem('creativo_current_user');
    if (!id) return null;
    return this.getUsers().find(u => u.id === id) || null;
  },
  clearCurrentUser() { localStorage.removeItem('creativo_current_user'); }
};

// UTILITIES
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(ts) {
  const d = new Date(ts), now = new Date(), diff = now - d;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getInitials(name) { return name.slice(0, 2).toUpperCase(); }

const AVATAR_COLORS = [
  '#B39DDB', '#F48FB1', '#80DEEA', '#FFE082', '#A5D6A7',
  '#EF9A9A', '#90CAF9', '#CE93D8', '#FFCC80', '#80CBC4'
];

function getAvatarColor(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

// AUTH
const Auth = {
  logout() {
    Storage.clearCurrentUser();
    window.location.href = 'index.html';
  },

  requireAuth() {
    const user = Storage.getCurrentUser();
    if (!user) { window.location.href = 'index.html'; return null; }
    return user;
  }
};

// POSTS
const Posts = {
  create(authorId, content, category) {
    const posts = Storage.getPosts();
    const post = {
      id: generateId(),
      authorId,
      content: content.trim(),
      category,
      reactions: { inspire: [], appreciate: [] },
      comments: [],
      createdAt: Date.now()
    };
    posts.unshift(post);
    Storage.setPosts(posts);
    return post;
  },

  delete(postId, userId) {
    let posts = Storage.getPosts();
    const post = posts.find(p => p.id === postId);
    if (!post || post.authorId !== userId) return false;
    Storage.setPosts(posts.filter(p => p.id !== postId));
    return true;
  },

  getById(id) { return Storage.getPosts().find(p => p.id === id) || null; },
  getAll() { return Storage.getPosts(); },
  getByUser(uid) { return Storage.getPosts().filter(p => p.authorId === uid); },

  getFeed(userId) {
    const user = Storage.getUsers().find(u => u.id === userId);
    if (!user) return [];
    const ids = [...user.following, userId];
    return Storage.getPosts().filter(p => ids.includes(p.authorId));
  },

  toggleReaction(postId, userId, type) {
    const posts = Storage.getPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) return null;
    const current = this.getUserReaction(post, userId);
    // Remove existing reaction
    ['inspire', 'appreciate'].forEach(t => {
      post.reactions[t] = post.reactions[t].filter(id => id !== userId);
    });
    // Add new reaction (toggle off if same)
    if (current !== type) post.reactions[type].push(userId);
    Storage.setPosts(posts);
    return post;
  },

  getUserReaction(post, userId) {
    for (const t of ['inspire', 'appreciate'])
      if (post.reactions[t].includes(userId)) return t;
    return null;
  }
};

// USERS
const Users = {
  getById(id) { return Storage.getUsers().find(u => u.id === id) || null; },
  getAll() { return Storage.getUsers(); },

  follow(currentId, targetId) {
    if (currentId === targetId) return false;
    const users = Storage.getUsers();
    const cur = users.find(u => u.id === currentId);
    if (!cur || cur.following.includes(targetId)) return false;
    cur.following.push(targetId);
    Storage.setUsers(users);
    return true;
  },

  unfollow(currentId, targetId) {
    const users = Storage.getUsers();
    const cur = users.find(u => u.id === currentId);
    if (!cur) return false;
    cur.following = cur.following.filter(id => id !== targetId);
    Storage.setUsers(users);
    return true;
  },

  isFollowing(currentId, targetId) {
    const u = this.getById(currentId);
    return u ? u.following.includes(targetId) : false;
  }
};

// CONSTANTS
const CATEGORIES = {
  poetry: { label: '✍️ Poetry', emoji: '✍️', name: 'Poetry' },
  story: { label: '📖 Story', emoji: '📖', name: 'Story' },
  artidea: { label: '🎨 Art Idea', emoji: '🎨', name: 'Art Idea' },
  prompt: { label: '💡 Prompt', emoji: '💡', name: 'Prompt' },
  motivation: { label: '✨ Motivation', emoji: '✨', name: 'Motivation' }
};

const REACTIONS = {
  inspire: { emoji: '❤️', label: 'Inspire' },
  appreciate: { emoji: '⭐', label: 'Appreciate' }
};

// UI HELPERS
const UI = {
  renderAvatar(user, size = 'md') {
    if (user && user.profilePicture) {
      return `<img src="${user.profilePicture}" alt="${user.username}" class="avatar avatar-${size}">`;
    }
    const u = user || { id: 'x', username: '??' };
    return `<div class="avatar avatar-${size} avatar-initials" style="background:${getAvatarColor(u.id)}">${getInitials(u.username)}</div>`;
  },

  renderPostCard(post, currentUser) {
    const author = Users.getById(post.authorId);
    if (!author) return '';
    const cat = CATEGORIES[post.category] || CATEGORIES.poetry;
    const userReaction = Posts.getUserReaction(post, currentUser.id);
    const isOwner = post.authorId === currentUser.id;

    return `
    <article class="post-card" data-post-id="${post.id}">
      <div class="post-card-header">
        <a href="profile.html?id=${author.id}" class="post-author-link">
          ${this.renderAvatar(author, 'sm')}
          <div class="post-author-info">
            <span class="post-author-name">@${author.username}</span>
            <span class="post-timestamp">${formatDate(post.createdAt)}</span>
          </div>
        </a>
        <div class="post-meta-right">
          <span class="category-badge cat-${post.category}">${cat.label}</span>
          ${isOwner ? `<button class="btn-icon-danger delete-post-btn" data-post-id="${post.id}" title="Delete post" aria-label="Delete post">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
          </button>` : ''}
        </div>
      </div>
      <a href="post.html?id=${post.id}" class="post-content-link">
        <div class="post-content">${this.escapeHtml(post.content)}</div>
      </a>
      <div class="post-footer">
        <div class="reaction-group">
          ${Object.entries(REACTIONS).map(([type, r]) => `
            <button class="reaction-btn ${userReaction === type ? 'active reaction-active-' + type : ''}"
              data-post-id="${post.id}" data-reaction="${type}" title="${r.label}">
              <span class="reaction-emoji">${r.emoji}</span>
              <span class="reaction-count">${post.reactions[type].length}</span>
            </button>
          `).join('')}
        </div>
        <a href="post.html?id=${post.id}" class="comment-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          <span>${post.comments.length}</span>
        </a>
      </div>
    </article>`;
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
  },

  showToast(message, type = 'success') {
    const old = document.querySelector('.toast');
    if (old) old.remove();
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.innerHTML = `<span>${type === 'success' ? '✨' : '⚠️'}</span> ${message}`;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3000);
  }
};

// SHARED: POST EVENT HANDLERS
function attachPostEvents(container, currentUser, onRefresh, isDetailPage = false) {
  // Reactions
  container.querySelectorAll('.reaction-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const postId = btn.dataset.postId;
      const reaction = btn.dataset.reaction;
      Posts.toggleReaction(postId, currentUser.id, reaction);
      if (onRefresh) onRefresh();
      else {
        // In-place update for feed
        const post = Posts.getById(postId);
        if (!post) return;
        const card = document.querySelector(`[data-post-id="${postId}"]`);
        if (!card) return;
        const newCard = document.createElement('div');
        newCard.innerHTML = UI.renderPostCard(post, currentUser);
        const newEl = newCard.firstElementChild;
        card.replaceWith(newEl);
        attachPostEvents(newEl, currentUser, null, isDetailPage);
      }
    });
  });

  // Delete post
  container.querySelectorAll('.delete-post-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!confirm('Delete this post?')) return;
      const postId = btn.dataset.postId;
      Posts.delete(postId, currentUser.id);
      UI.showToast('Post deleted');
      if (isDetailPage) {
        window.location.href = 'feed.html';
      } else if (onRefresh) {
        onRefresh();
      } else {
        document.querySelector(`article[data-post-id="${postId}"]`)?.remove();
      }
    });
  });
}

// SHARED: NAVBAR SETUP
function setupNavbar(currentUser) {
  const avatar = document.getElementById('navbar-avatar');
  if (avatar) avatar.innerHTML = UI.renderAvatar(currentUser, 'xs');

  const username = document.getElementById('navbar-username');
  if (username) username.textContent = '@' + currentUser.username;

  const profileLink = document.getElementById('navbar-ProfileLink');
  if (profileLink) profileLink.href = `profile.html?id=${currentUser.id}`;

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => {
    if (confirm('Log out of Creativo?')) Auth.logout();
  });

  // Search
  const searchInput = document.getElementById('navSearch');
  const searchResults = document.getElementById('searchResults');
  if (searchInput && searchResults) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      if (!q) { searchResults.style.display = 'none'; return; }
      const users = Users.getAll().filter(u => u.username.toLowerCase().includes(q));
      if (users.length === 0) { searchResults.style.display = 'none'; return; }
      searchResults.innerHTML = users.slice(0, 5).map(u => `
        <a href="profile.html?id=${u.id}" class="search-result-item">
          ${UI.renderAvatar(u, 'xs')}
          <span>@${u.username}</span>
        </a>`).join('');
      searchResults.style.display = 'block';
    });

    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target)) searchResults.style.display = 'none';
    });
  }
}

// PAGE FEED
function initFeedPage() {
  const currentUser = Auth.requireAuth();
  if (!currentUser) return;

  let activeFilter = 'all';
  let activeTab = 'feed'; // 'feed' or 'explore'

  // Navbar
  setupNavbar(currentUser);

  // Render tabs
  const tabFeed = document.getElementById('tabFeed');
  const tabExplore = document.getElementById('tabExplore');
  tabFeed.addEventListener('click', () => { activeTab = 'feed'; renderFeedTab(); });
  tabExplore.addEventListener('click', () => { activeTab = 'explore'; renderExploreTab(); });

  // Category sidebar
  document.querySelectorAll('.cat-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.cat;
      if (activeTab === 'feed') renderFeedTab();
      else renderExploreTab();
    });
  });

  // Post creation
  const postTextarea = document.getElementById('postContent');
  const charCount = document.getElementById('charCount');
  const categoryBtns = document.querySelectorAll('.cat-select-btn');
  const submitPost = document.getElementById('submitPost');
  let selectedCategory = 'poetry';

  // Select default category
  document.querySelector('[data-cat-select="poetry"]').classList.add('selected');

  postTextarea.addEventListener('input', () => {
    const len = postTextarea.value.length;
    charCount.textContent = 200 - len;
    if (len > 200) {
      charCount.classList.add('over');
      postTextarea.value = postTextarea.value.slice(0, 200);
      charCount.textContent = 0;
    } else {
      charCount.classList.remove('over');
    }
  });

  categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      categoryBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedCategory = btn.dataset.catSelect;
    });
  });

  submitPost.addEventListener('click', () => {
    const content = postTextarea.value.trim();
    if (!content) { UI.showToast('Write something creative first! ✨', 'error'); return; }
    if (content.length > 200) { UI.showToast('Keep it under 200 characters!', 'error'); return; }

    Posts.create(currentUser.id, content, selectedCategory);
    postTextarea.value = '';
    charCount.textContent = 200;
    UI.showToast('Your creation is live! ✨');
    renderFeedTab();
  });

  // Allow Ctrl+Enter to submit
  postTextarea.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') submitPost.click();
  });

  function renderFeedTab() {
    tabFeed.classList.add('active');
    tabExplore.classList.remove('active');
    const feedEl = document.getElementById('feedContainer');
    const exploreEl = document.getElementById('exploreContainer');
    feedEl.style.display = 'block';
    exploreEl.style.display = 'none';

    let posts = Posts.getFeed(currentUser.id);
    if (activeFilter !== 'all') posts = posts.filter(p => p.category === activeFilter);

    feedEl.innerHTML = '';
    if (posts.length === 0) {
      feedEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🌱</div>
          <h3>Nothing here yet</h3>
          <p>${activeFilter !== 'all' ? 'No posts in this category from people you follow.' : 'Follow some creators to see their posts here!'}</p>
          <button class="post-button" onclick="document.getElementById('tabExplore').click()">Discover Creators</button>
        </div>`;
      return;
    }

    posts.forEach(post => {
      feedEl.innerHTML += UI.renderPostCard(post, currentUser);
    });
    attachPostEvents(feedEl, currentUser);
  }

  function renderExploreTab() {
    tabFeed.classList.remove('active');
    tabExplore.classList.add('active');
    const feedEl = document.getElementById('feedContainer');
    const exploreEl = document.getElementById('exploreContainer');
    feedEl.style.display = 'none';
    exploreEl.style.display = 'block';

    // All posts (not just following)
    let posts = Posts.getAll();
    if (activeFilter !== 'all') posts = posts.filter(p => p.category === activeFilter);

    // Explore users sidebar - re-render for updated follow state
    renderExploreSidebar(currentUser);

    const postsEl = document.getElementById('explorePosts');
    postsEl.innerHTML = '';
    if (posts.length === 0) {
      postsEl.innerHTML = '<div class="empty-state"><div class="empty-icon">🎭</div><h3>No posts yet</h3><p>Be the first to create!</p></div>';
      return;
    }
    posts.forEach(post => {
      postsEl.innerHTML += UI.renderPostCard(post, currentUser);
    });
    attachPostEvents(postsEl, currentUser);
  }

  function renderExploreSidebar(currentUser) {
    const sidebarEl = document.getElementById('exploreSidebar');
    if (!sidebarEl) return;
    const allUsers = Users.getAll().filter(u => u.id !== currentUser.id);
    sidebarEl.innerHTML = '<h3 class="sidebar-section-title">Discover Creators</h3>';
    if (allUsers.length === 0) {
      sidebarEl.innerHTML += '<p class="sidebar-empty">No other users yet.</p>';
      return;
    }
    allUsers.forEach(u => {
      const isFollowing = Users.isFollowing(currentUser.id, u.id);
      const postCount = Posts.getByUser(u.id).length;
      sidebarEl.innerHTML += `
        <div class="explore-user-card">
          <a href="profile.html?id=${u.id}" class="explore-user-info">
            ${UI.renderAvatar(u, 'sm')}
            <div>
              <span class="explore-username">@${u.username}</span>
              <span class="explore-posts">${postCount} post${postCount !== 1 ? 's' : ''}</span>
            </div>
          </a>
          <button class="btn-follow ${isFollowing ? 'following' : ''}" 
            data-user-id="${u.id}" data-following="${isFollowing}">
            ${isFollowing ? 'Following' : 'Follow'}
          </button>
        </div>`;
    });

    // Attach follow events in sidebar
    sidebarEl.querySelectorAll('.btn-follow').forEach(btn => {
      btn.addEventListener('click', () => handleFollow(btn, currentUser));
    });
  }

  function handleFollow(btn, currentUser) {
    const targetId = btn.dataset.userId;
    const isFollowing = btn.dataset.following === 'true';
    if (isFollowing) {
      Users.unfollow(currentUser.id, targetId);
      btn.textContent = 'Follow';
      btn.dataset.following = 'false';
      btn.classList.remove('following');
      UI.showToast('Unfollowed');
    } else {
      Users.follow(currentUser.id, targetId);
      btn.textContent = 'Following';
      btn.dataset.following = 'true';
      btn.classList.add('following');
      UI.showToast('Now following ✨');
    }
    if (activeTab === 'feed') renderFeedTab();
  }

  // Init
  renderFeedTab();
  renderExploreSidebar(currentUser); // Always show Discover sidebar
}

// ============================================================
// PAGE ROUTER
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  if (page === 'feed') initFeedPage();
});
