// ============================================================
// CREATIVO — Social Media Platform for Creative Expressions
// app.js — Core Application Logic
// ============================================================

// ============================================================
// STORAGE HELPERS
// ============================================================
const Storage = {
  get(key) {
    try { return JSON.parse(localStorage.getItem(key)); }
    catch { return null; }
  },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); },
  getUsers()      { return this.get('creativo_users')  || []; },
  setUsers(u)     { this.set('creativo_users', u); },
  getPosts()      { return this.get('creativo_posts')  || []; },
  setPosts(p)     { this.set('creativo_posts', p); },
  getCurrentUser() {
    const id = localStorage.getItem('creativo_current_user');
    if (!id) return null;
    return this.getUsers().find(u => u.id === id) || null;
  },
  setCurrentUser(id) { localStorage.setItem('creativo_current_user', id); },
  clearCurrentUser() { localStorage.removeItem('creativo_current_user'); }
};

// ============================================================
// UTILITIES
// ============================================================
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(ts) {
  const d = new Date(ts), now = new Date(), diff = now - d;
  if (diff < 60000)    return 'just now';
  if (diff < 3600000)  return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000)return `${Math.floor(diff / 86400000)}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getInitials(name) { return name.slice(0, 2).toUpperCase(); }

const AVATAR_COLORS = [
  '#B39DDB','#F48FB1','#80DEEA','#FFE082','#A5D6A7',
  '#EF9A9A','#90CAF9','#CE93D8','#FFCC80','#80CBC4'
];

function getAvatarColor(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(pw) {
  return pw.length >= 6;
}

// ============================================================
// AUTH
// ============================================================
const Auth = {
  register(username, email, password) {
    const users = Storage.getUsers();
    if (!username.trim() || username.length < 2)
      return { success: false, error: 'Username must be at least 2 characters.' };
    if (!validateEmail(email))
      return { success: false, error: 'Please enter a valid email address.' };
    if (!validatePassword(password))
      return { success: false, error: 'Password must be at least 6 characters.' };
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase()))
      return { success: false, error: 'This email is already registered.' };
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase()))
      return { success: false, error: 'This username is already taken.' };

    const user = {
      id: generateId(),
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password,
      bio: '',
      profilePicture: null,
      following: [],
      createdAt: Date.now()
    };
    users.push(user);
    Storage.setUsers(users);
    return { success: true, user };
  },

  login(emailOrUsername, password) {
    const users = Storage.getUsers();
    const user = users.find(u =>
      (u.email.toLowerCase() === emailOrUsername.toLowerCase() ||
       u.username.toLowerCase() === emailOrUsername.toLowerCase()) &&
      u.password === password
    );
    if (!user) return { success: false, error: 'Incorrect credentials. Please try again.' };
    Storage.setCurrentUser(user.id);
    return { success: true, user };
  },

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

// ============================================================
// POSTS
// ============================================================
const Posts = {
  create(authorId, content, category) {
    const posts = Storage.getPosts();
    const post = {
      id: generateId(),
      authorId,
      content: content.trim(),
      category,
      reactions: { inspire: [], appreciate: [], admire: [] },
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

  getById(id)     { return Storage.getPosts().find(p => p.id === id) || null; },
  getAll()        { return Storage.getPosts(); },
  getByUser(uid)  { return Storage.getPosts().filter(p => p.authorId === uid); },

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
    ['inspire', 'appreciate', 'admire'].forEach(t => {
      post.reactions[t] = post.reactions[t].filter(id => id !== userId);
    });
    // Add new reaction (toggle off if same)
    if (current !== type) post.reactions[type].push(userId);
    Storage.setPosts(posts);
    return post;
  },

  getUserReaction(post, userId) {
    for (const t of ['inspire', 'appreciate', 'admire'])
      if (post.reactions[t].includes(userId)) return t;
    return null;
  },

  addComment(postId, authorId, content) {
    const posts = Storage.getPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) return null;
    const comment = { id: generateId(), authorId, content: content.trim(), createdAt: Date.now() };
    post.comments.push(comment);
    Storage.setPosts(posts);
    return comment;
  },

  deleteComment(postId, commentId, userId) {
    const posts = Storage.getPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) return false;
    const comment = post.comments.find(c => c.id === commentId);
    if (!comment || (comment.authorId !== userId && post.authorId !== userId)) return false;
    post.comments = post.comments.filter(c => c.id !== commentId);
    Storage.setPosts(posts);
    return true;
  }
};

// ============================================================
// USERS
// ============================================================
const Users = {
  getById(id)  { return Storage.getUsers().find(u => u.id === id) || null; },
  getAll()     { return Storage.getUsers(); },

  update(userId, updates) {
    const users = Storage.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) return null;
    users[idx] = { ...users[idx], ...updates };
    Storage.setUsers(users);
    return users[idx];
  },

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
  },

  getFollowers(userId) {
    return Storage.getUsers().filter(u => u.following.includes(userId));
  }
};

// ============================================================
// CONSTANTS
// ============================================================
const CATEGORIES = {
  poetry:     { label: '✍️ Poetry',     emoji: '✍️', name: 'Poetry'     },
  story:      { label: '📖 Story',      emoji: '📖', name: 'Story'      },
  artidea:    { label: '🎨 Art Idea',   emoji: '🎨', name: 'Art Idea'   },
  prompt:     { label: '💡 Prompt',     emoji: '💡', name: 'Prompt'     },
  motivation: { label: '🌈 Motivation', emoji: '🌈', name: 'Motivation' }
};

const REACTIONS = {
  inspire:    { emoji: '❤️', label: 'Inspire'    },
  appreciate: { emoji: '⭐', label: 'Appreciate' },
  admire:     { emoji: '🎨', label: 'Admire'     }
};

// ============================================================
// UI HELPERS
// ============================================================
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
    const totalReactions = Object.values(post.reactions).flat().length;

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
  },

  showModal(id) {
    const m = document.getElementById(id);
    if (m) { m.classList.add('active'); document.body.classList.add('modal-open'); }
  },

  hideModal(id) {
    const m = document.getElementById(id);
    if (m) { m.classList.remove('active'); document.body.classList.remove('modal-open'); }
  }
};

// ============================================================
// SEED DATA
// ============================================================
function seedData() {
  if (Storage.getUsers().length > 0) return;
  const u1 = 'seed_u1', u2 = 'seed_u2', u3 = 'seed_u3';
  Storage.setUsers([
    { id: u1, username: 'Luna', email: 'luna@creativo.art', password: 'pass123', bio: 'Weaving words into worlds. 🌙 Poetry is my heartbeat.', profilePicture: null, following: [u2, u3], createdAt: Date.now() - 86400000 * 7 },
    { id: u2, username: 'Orion', email: 'orion@creativo.art', password: 'pass123', bio: 'Short stories, big feelings. Every word counts. ⭐', profilePicture: null, following: [u1, u3], createdAt: Date.now() - 86400000 * 5 },
    { id: u3, username: 'IrisBloom', email: 'iris@creativo.art', password: 'pass123', bio: '🎨 Art lives in the spaces between thoughts.', profilePicture: null, following: [u1], createdAt: Date.now() - 86400000 * 3 },
  ]);
  Storage.setPosts([
    { id: 'sp1', authorId: u1, content: 'The stars whispered secrets only the lonely could hear. And I — I listened all night.', category: 'poetry', reactions: { inspire: [u2, u3], appreciate: [], admire: [u2] }, comments: [{ id: 'sc1', authorId: u2, content: 'This is hauntingly beautiful 💫', createdAt: Date.now() - 3600000 }], createdAt: Date.now() - 86400000 },
    { id: 'sp2', authorId: u2, content: 'Write a story where the villain is just... tired. Tired of being the villain.', category: 'prompt', reactions: { inspire: [u1], appreciate: [u3], admire: [] }, comments: [{ id: 'sc2', authorId: u3, content: 'I\'m already writing this! 🖊️', createdAt: Date.now() - 1800000 }], createdAt: Date.now() - 43200000 },
    { id: 'sp3', authorId: u3, content: 'Imagine painting a rainbow using only shades of grey — the beauty lives in the gradient between them.', category: 'artidea', reactions: { inspire: [u1, u2], appreciate: [u1], admire: [u2] }, comments: [], createdAt: Date.now() - 7200000 },
    { id: 'sp4', authorId: u1, content: 'She left a note. It said only: "I found myself — I left a trail of breadcrumbs back to you."', category: 'story', reactions: { inspire: [u3], appreciate: [], admire: [] }, comments: [], createdAt: Date.now() - 3600000 },
    { id: 'sp5', authorId: u2, content: "Today's reminder: You don't need to earn rest. You deserve it simply by existing.", category: 'motivation', reactions: { inspire: [u1, u3], appreciate: [u3], admire: [u1] }, comments: [{ id: 'sc3', authorId: u1, content: 'Needed this today 💜', createdAt: Date.now() - 900000 }], createdAt: Date.now() - 1800000 },
  ]);
}

// ============================================================
// PAGE: AUTH (index.html)
// ============================================================
function initAuthPage() {
  seedData();
  if (Storage.getCurrentUser()) {
    window.location.href = 'feed.html';
    return;
  }

  const loginTab    = document.getElementById('loginTab');
  const registerTab = document.getElementById('registerTab');
  const loginForm   = document.getElementById('loginForm');
  const registerForm= document.getElementById('registerForm');
  const showRegLink = document.getElementById('showRegister');
  const showLogLink = document.getElementById('showLogin');

  function showTab(tab) {
    if (tab === 'login') {
      loginTab.classList.add('active');
      registerTab.classList.remove('active');
      loginForm.classList.add('active');
      registerForm.classList.remove('active');
    } else {
      registerTab.classList.add('active');
      loginTab.classList.remove('active');
      registerForm.classList.add('active');
      loginForm.classList.remove('active');
    }
  }

  loginTab.addEventListener('click', () => showTab('login'));
  registerTab.addEventListener('click', () => showTab('register'));
  if (showRegLink) showRegLink.addEventListener('click', (e) => { e.preventDefault(); showTab('register'); });
  if (showLogLink) showLogLink.addEventListener('click', (e) => { e.preventDefault(); showTab('login'); });

  // Login
  document.getElementById('loginFormEl').addEventListener('submit', function(e) {
    e.preventDefault();
    const emailOrUsername = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');

    clearError('loginError');
    const result = Auth.login(emailOrUsername, password);
    if (result.success) {
      window.location.href = 'feed.html';
    } else {
      showError('loginError', result.error);
    }
  });

  // Register
  document.getElementById('registerFormEl').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('regUsername').value.trim();
    const email    = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirm  = document.getElementById('regConfirm').value;

    clearError('registerError');
    if (password !== confirm) {
      showError('registerError', 'Passwords do not match.'); return;
    }

    const result = Auth.register(username, email, password);
    if (result.success) {
      UI.showToast('Account created! Please log in.', 'success');
      showTab('login');
      document.getElementById('loginEmail').value = email;
    } else {
      showError('registerError', result.error);
    }
  });

  function showError(id, msg) {
    const el = document.getElementById(id);
    if (el) { el.textContent = msg; el.style.display = 'flex'; }
  }
  function clearError(id) {
    const el = document.getElementById(id);
    if (el) { el.textContent = ''; el.style.display = 'none'; }
  }

  // Password strength
  const pwInput = document.getElementById('regPassword');
  const strengthBar = document.getElementById('strengthBar');
  if (pwInput && strengthBar) {
    pwInput.addEventListener('input', () => {
      const v = pwInput.value;
      let score = 0;
      if (v.length >= 6) score++;
      if (v.length >= 10) score++;
      if (/[A-Z]/.test(v)) score++;
      if (/[0-9]/.test(v)) score++;
      if (/[^A-Za-z0-9]/.test(v)) score++;
      const levels = ['', 'weak', 'fair', 'good', 'strong', 'strong'];
      strengthBar.className = 'strength-bar ' + (levels[score] || '');
      strengthBar.style.width = (score * 20) + '%';
    });
  }

  // Toggle password visibility
  document.querySelectorAll('.toggle-pw').forEach(btn => {
    btn.addEventListener('click', () => {
      const inputId = btn.dataset.target;
      const input = document.getElementById(inputId);
      if (!input) return;
      input.type = input.type === 'password' ? 'text' : 'password';
      btn.innerHTML = input.type === 'password'
        ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
    });
  });
}

// ============================================================
// PAGE: FEED (feed.html)
// ============================================================
function initFeedPage() {
  const currentUser = Auth.requireAuth();
  if (!currentUser) return;

  let activeFilter = 'all';
  let activeTab = 'feed'; // 'feed' or 'explore'

  // Navbar
  setupNavbar(currentUser);

  // Render tabs
  const tabFeed    = document.getElementById('tabFeed');
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
  const charCount    = document.getElementById('charCount');
  const categoryBtns = document.querySelectorAll('.cat-select-btn');
  const submitPost   = document.getElementById('submitPost');
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
          <button class="btn-primary" onclick="document.getElementById('tabExplore').click()">Discover Creators</button>
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
    const feedEl    = document.getElementById('feedContainer');
    const exploreEl = document.getElementById('exploreContainer');
    feedEl.style.display = 'none';
    exploreEl.style.display = 'block';

    // All posts (not just following)
    let posts = Posts.getAll();
    if (activeFilter !== 'all') posts = posts.filter(p => p.category === activeFilter);

    // Explore users sidebar — re-render for updated follow state
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
    const targetId   = btn.dataset.userId;
    const isFollowing= btn.dataset.following === 'true';
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
// PAGE: PROFILE (profile.html)
// ============================================================
function initProfilePage() {
  const currentUser = Auth.requireAuth();
  if (!currentUser) return;

  setupNavbar(currentUser);

  const params    = new URLSearchParams(window.location.search);
  const profileId = params.get('id') || currentUser.id;
  let profileUser = Users.getById(profileId);

  if (!profileUser) {
    document.querySelector('.profile-container').innerHTML = '<div class="empty-state"><div class="empty-icon">😕</div><h3>User not found</h3></div>';
    return;
  }

  function renderProfile() {
    profileUser = Users.getById(profileId); // Fresh data
    const isOwn = profileUser.id === currentUser.id;
    const isFollowing = Users.isFollowing(currentUser.id, profileUser.id);
    const posts = Posts.getByUser(profileUser.id);
    const followers = Users.getFollowers(profileUser.id);
    const following = profileUser.following.length;

    // Header
    document.getElementById('profileAvatar').innerHTML = UI.renderAvatar(profileUser, 'lg');
    document.getElementById('profileUsername').textContent = '@' + profileUser.username;
    document.getElementById('profileBio').textContent = profileUser.bio || (isOwn ? 'No bio yet — tell the world about your creative soul!' : 'No bio yet.');
    document.getElementById('profilePostCount').textContent    = posts.length;
    document.getElementById('profileFollowerCount').textContent= followers.length;
    document.getElementById('profileFollowingCount').textContent = following;

    const actionEl = document.getElementById('profileAction');
    if (isOwn) {
      actionEl.innerHTML = `<button class="btn-primary" id="editProfileBtn">Edit Profile</button>`;
      document.getElementById('editProfileBtn').addEventListener('click', () => {
        document.getElementById('editUsername').value = profileUser.username;
        document.getElementById('editBio').value = profileUser.bio || '';
        UI.showModal('editProfileModal');
      });
    } else {
      actionEl.innerHTML = `<button class="btn-follow ${isFollowing ? 'following' : ''}" id="followBtn" data-following="${isFollowing}">
        ${isFollowing ? '✓ Following' : '+ Follow'}
      </button>`;
      document.getElementById('followBtn').addEventListener('click', function() {
        const following = this.dataset.following === 'true';
        if (following) {
          Users.unfollow(currentUser.id, profileUser.id);
          UI.showToast('Unfollowed');
        } else {
          Users.follow(currentUser.id, profileUser.id);
          UI.showToast('Now following! ✨');
        }
        renderProfile();
      });
    }

    // Posts
    const postsContainer = document.getElementById('profilePosts');
    postsContainer.innerHTML = '';
    if (posts.length === 0) {
      postsContainer.innerHTML = `<div class="empty-state"><div class="empty-icon">🖊️</div><h3>No posts yet</h3><p>${isOwn ? 'Share your first creative expression!' : `${profileUser.username} hasn't posted yet.`}</p></div>`;
      return;
    }
    posts.forEach(post => {
      postsContainer.innerHTML += UI.renderPostCard(post, currentUser);
    });
    attachPostEvents(postsContainer, currentUser, () => renderProfile());
  }

  renderProfile();

  // Edit profile modal
  document.getElementById('editProfileForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const newUsername = document.getElementById('editUsername').value.trim();
    const newBio      = document.getElementById('editBio').value.trim();

    if (!newUsername || newUsername.length < 2) {
      UI.showToast('Username too short', 'error'); return;
    }
    const existing = Users.getAll().find(u => u.username.toLowerCase() === newUsername.toLowerCase() && u.id !== currentUser.id);
    if (existing) { UI.showToast('Username taken', 'error'); return; }

    Users.update(currentUser.id, { username: newUsername, bio: newBio });
    UI.hideModal('editProfileModal');
    UI.showToast('Profile updated! ✨');
    renderProfile();
  });

  // Profile picture upload
  const picInput = document.getElementById('profilePicInput');
  if (picInput) {
    picInput.addEventListener('change', function() {
      const file = this.files[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) { UI.showToast('Image too large (max 2MB)', 'error'); return; }
      const reader = new FileReader();
      reader.onload = (e) => {
        Users.update(currentUser.id, { profilePicture: e.target.result });
        UI.showToast('Profile picture updated! ✨');
        renderProfile();
      };
      reader.readAsDataURL(file);
    });
  }

  // Modal close
  document.querySelectorAll('.modal-close, .modal-overlay').forEach(el => {
    el.addEventListener('click', () => UI.hideModal('editProfileModal'));
  });
}

// ============================================================
// PAGE: POST DETAIL (post.html)
// ============================================================
function initPostPage() {
  const currentUser = Auth.requireAuth();
  if (!currentUser) return;

  setupNavbar(currentUser);

  const params = new URLSearchParams(window.location.search);
  const postId = params.get('id');
  if (!postId) { window.location.href = 'feed.html'; return; }

  function renderPost() {
    const post = Posts.getById(postId);
    if (!post) {
      document.getElementById('postDetailContainer').innerHTML =
        '<div class="empty-state"><div class="empty-icon">😕</div><h3>Post not found</h3><a href="feed.html" class="btn-primary">Back to Feed</a></div>';
      return;
    }

    const author = Users.getById(post.authorId);
    const cat = CATEGORIES[post.category] || CATEGORIES.poetry;
    const userReaction = Posts.getUserReaction(post, currentUser.id);
    const isOwner = post.authorId === currentUser.id;

    document.getElementById('postDetailContainer').innerHTML = `
      <article class="post-detail-card">
        <div class="post-card-header">
          <a href="profile.html?id=${author.id}" class="post-author-link">
            ${UI.renderAvatar(author, 'md')}
            <div class="post-author-info">
              <span class="post-author-name">@${author.username}</span>
              <span class="post-timestamp">${formatDate(post.createdAt)}</span>
            </div>
          </a>
          <div class="post-meta-right">
            <span class="category-badge cat-${post.category}">${cat.label}</span>
            ${isOwner ? `<button class="btn-icon-danger delete-post-btn" data-post-id="${post.id}" title="Delete">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
            </button>` : ''}
          </div>
        </div>
        <div class="post-content post-content-large">${UI.escapeHtml(post.content)}</div>
        <div class="post-footer">
          <div class="reaction-group">
            ${Object.entries(REACTIONS).map(([type, r]) => `
              <button class="reaction-btn ${userReaction === type ? 'active reaction-active-' + type : ''}"
                data-post-id="${post.id}" data-reaction="${type}" title="${r.label}">
                <span class="reaction-emoji">${r.emoji}</span>
                <span class="reaction-label">${r.label}</span>
                <span class="reaction-count">${post.reactions[type].length}</span>
              </button>
            `).join('')}
          </div>
        </div>
      </article>
      <section class="comments-section">
        <h3 class="comments-title">Responses <span class="comment-count-badge">${post.comments.length}</span></h3>
        <div class="comment-form-wrapper">
          ${UI.renderAvatar(currentUser, 'sm')}
          <div class="comment-input-group">
            <textarea id="commentInput" placeholder="Share your response..." rows="2" maxlength="500"></textarea>
            <button id="submitComment" class="btn-primary btn-sm">Respond</button>
          </div>
        </div>
        <div id="commentsList" class="comments-list">
          ${renderComments(post, currentUser)}
        </div>
      </section>`;

    // Attach events
    attachPostEvents(document.getElementById('postDetailContainer'), currentUser, renderPost, true);

    document.getElementById('submitComment').addEventListener('click', () => {
      const content = document.getElementById('commentInput').value.trim();
      if (!content) return;
      Posts.addComment(postId, currentUser.id, content);
      document.getElementById('commentInput').value = '';
      UI.showToast('Response added! 💬');
      renderPost();
    });

    document.getElementById('commentInput').addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') document.getElementById('submitComment').click();
    });

    // Delete comment buttons
    document.querySelectorAll('.delete-comment-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Delete this comment?')) {
          Posts.deleteComment(postId, btn.dataset.commentId, currentUser.id);
          renderPost();
        }
      });
    });
  }

  function renderComments(post, currentUser) {
    if (post.comments.length === 0) {
      return '<div class="empty-comments"><p>Be the first to respond! ✨</p></div>';
    }
    return post.comments.map(c => {
      const author = Users.getById(c.authorId);
      if (!author) return '';
      const canDelete = c.authorId === currentUser.id || post.authorId === currentUser.id;
      return `
        <div class="comment-item">
          <a href="profile.html?id=${author.id}">${UI.renderAvatar(author, 'xs')}</a>
          <div class="comment-body">
            <div class="comment-header">
              <a href="profile.html?id=${author.id}" class="comment-author">@${author.username}</a>
              <span class="comment-time">${formatDate(c.createdAt)}</span>
              ${canDelete ? `<button class="delete-comment-btn btn-logout-danger" data-comment-id="${c.id}" title="Delete">×</button>` : ''}
            </div>
            <p class="comment-content">${UI.escapeHtml(c.content)}</p>
          </div>
        </div>`;
    }).join('');
  }

  renderPost();
}

// ============================================================
// SHARED: POST EVENT HANDLERS
// ============================================================
function attachPostEvents(container, currentUser, onRefresh, isDetailPage = false) {
  // Reactions
  container.querySelectorAll('.reaction-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const postId   = btn.dataset.postId;
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

// ============================================================
// SHARED: NAVBAR SETUP
// ============================================================
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

  // Mobile menu toggle
  const menuToggle = document.getElementById('mobileMenuToggle');
  const navMenu    = document.getElementById('navMenu');
  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => navMenu.classList.toggle('open'));
  }

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

// ============================================================
// PAGE ROUTER
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  if (page === 'auth')    initAuthPage();
  else if (page === 'feed')    initFeedPage();
  else if (page === 'profile') initProfilePage();
  else if (page === 'post')    initPostPage();
});
