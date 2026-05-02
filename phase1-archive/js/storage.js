/*  ID GENERATOR  */

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}


/*  STORAGE  */

const Storage = {
    get(key) {
        try { return JSON.parse(localStorage.getItem(key)); }
        catch { return null; }
    },

    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },

    /* users array */
    getUsers() { return this.get('creativo_users') || []; },
    setUsers(u) { this.set('creativo_users', u); },

    /* posts array */
    getPosts() { return this.get('creativo_posts') || []; },
    setPosts(p) { this.set('creativo_posts', p); },

    /* current session — stores the logged-in user's id */
    getCurrentUser() {
        const id = localStorage.getItem('creativo_current_user');
        if (!id) return null;
        return this.getUsers().find(u => u.id === id) || null;
    },

    setCurrentUser(id) {
        localStorage.setItem('creativo_current_user', id);
    },

    clearCurrentUser() {
        localStorage.removeItem('creativo_current_user');
    }
};


/*  AUTH  */

const Auth = {
    /* log out and redirect to login page */
    logout() {
        Storage.clearCurrentUser();
        window.location.href = 'index.html';
    },

    /* redirect to login if no session found; returns user or null */
    requireAuth() {
        const user = Storage.getCurrentUser();
        if (!user) { window.location.href = 'index.html'; return null; }
        return user;
    }
};


/*  USERS  */

const Users = {
    getAll() { return Storage.getUsers(); },
    getById(id) { return Storage.getUsers().find(u => u.id === id) || null; },

    /* add targetId to currentId's following list */
    follow(currentId, targetId) {
        if (currentId === targetId) return false;
        const users = Storage.getUsers();
        const cur = users.find(u => u.id === currentId);
        if (!cur || cur.following.includes(targetId)) return false;
        cur.following.push(targetId);
        Storage.setUsers(users);
        return true;
    },

    /* remove targetId from currentId's following list */
    unfollow(currentId, targetId) {
        const users = Storage.getUsers();
        const cur = users.find(u => u.id === currentId);
        if (!cur) return false;
        cur.following = cur.following.filter(id => id !== targetId);
        Storage.setUsers(users);
        return true;
    },

    /* check if currentId is following targetId */
    isFollowing(currentId, targetId) {
        const u = this.getById(currentId);
        return u ? u.following.includes(targetId) : false;
    }
};


/*  POSTS  */

const Posts = {
    getAll() { return Storage.getPosts(); },
    getById(id) { return Storage.getPosts().find(p => p.id === id) || null; },
    getByUser(uid) { return Storage.getPosts().filter(p => p.authorId === uid); },

    /* posts from users that userId follows, plus their own */
    getFeed(userId) {
        const user = Users.getById(userId);
        if (!user) return [];
        const ids = [...user.following, userId];
        return Storage.getPosts().filter(p => ids.includes(p.authorId));
    },

    /* create a new post and prepend it to the list */
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

    /* delete a post — only the owner can do this */
    delete(postId, userId) {
        const posts = Storage.getPosts();
        const post = posts.find(p => p.id === postId);
        if (!post || post.authorId !== userId) return false;
        Storage.setPosts(posts.filter(p => p.id !== postId));
        return true;
    },

    /* toggle a reaction (inspire / appreciate) on a post */
    toggleReaction(postId, userId, type) {
        const posts = Storage.getPosts();
        const post = posts.find(p => p.id === postId);
        if (!post) return null;
        const current = this.getUserReaction(post, userId);
        /* remove any existing reaction first */
        ['inspire', 'appreciate'].forEach(t => {
            post.reactions[t] = post.reactions[t].filter(id => id !== userId);
        });
        /* add new reaction, unless it is the same one (toggle off) */
        if (current !== type) post.reactions[type].push(userId);
        Storage.setPosts(posts);
        return post;
    },

    /* return the reaction type the user has on this post, or null */
    getUserReaction(post, userId) {
        for (const t of ['inspire', 'appreciate'])
            if (post.reactions[t].includes(userId)) return t;
        return null;
    },

    /* add a comment to a post */
    addComment(postId, authorId, text) {
        const posts = Storage.getPosts();
        const post = posts.find(p => p.id === postId);
        if (!post || !text.trim()) return null;
        const comment = {
            id: generateId(),
            authorId,
            text: text.trim(),
            createdAt: Date.now()
        };
        post.comments.push(comment);
        Storage.setPosts(posts);
        return comment;
    },

    /* remove a comment — only the comment author can do this */
    deleteComment(postId, commentId, userId) {
        const posts = Storage.getPosts();
        const post = posts.find(p => p.id === postId);
        if (!post) return false;
        const comment = post.comments.find(c => c.id === commentId);
        if (!comment || comment.authorId !== userId) return false;
        post.comments = post.comments.filter(c => c.id !== commentId);
        Storage.setPosts(posts);
        return true;
    }
};


/*  CONSTANTS  */

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


/*  UTILITIES */

/* format a timestamp into a human-readable relative string */
function formatDate(ts) {
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* return the first two letters of a name, uppercased */
function getInitials(name) { return name.slice(0, 2).toUpperCase(); }

/* pick a deterministic colour from a user id */
const AVATAR_COLORS = [
    '#B39DDB', '#F48FB1', '#80DEEA', '#FFE082',
    '#A5D6A7', '#EF9A9A', '#90CAF9', '#CE93D8'
];

function getAvatarColor(id) {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

/* prevent XSS when inserting user-generated content into innerHTML */
function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(String(str)));
    return div.innerHTML;
}


/*  UI HELPERS */

const UI = {
    /* render an avatar: image if the user has one, initials fallback otherwise */
    renderAvatar(user, size = 'md') {
        if (user && user.profilePicture) {
            return `<img src="${user.profilePicture}" alt="${escapeHtml(user.username)}" class="avatar avatar-${size}">`;
        }
        const u = user || { id: 'x', username: '??' };
        return `<div class="avatar avatar-${size} avatar-initials" style="background:${getAvatarColor(u.id)}">${getInitials(u.username)}</div>`;
    },

    /* render a full post card as an HTML string */
    renderPostCard(post, currentUser) {
        const author = Users.getById(post.authorId);
        if (!author) return '';

        const cat = CATEGORIES[post.category] || CATEGORIES.poetry;
        const userReaction = Posts.getUserReaction(post, currentUser.id);
        const isOwner = post.authorId === currentUser.id;

        /* build comment rows */
        const commentsHtml = post.comments.map(c => {
            const cAuthor = Users.getById(c.authorId);
            if (!cAuthor) return '';
            const canDelete = c.authorId === currentUser.id;
            return `
            <div class="comment" data-comment-id="${c.id}">
                <div class="comment-avatar">${this.renderAvatar(cAuthor, 'xs')}</div>
                <div class="comment-body">
                    <span class="comment-author">${escapeHtml(cAuthor.username)}</span>
                    <span class="comment-text">${escapeHtml(c.text)}</span>
                    <span class="comment-time">${formatDate(c.createdAt)}</span>
                </div>
                ${canDelete ? `<button class="comment-delete-btn"
                    data-post-id="${post.id}" data-comment-id="${c.id}"
                    title="Delete comment">✕</button>` : ''}
            </div>`;
        }).join('');

        /* reaction buttons */
        const reactionsHtml = Object.entries(REACTIONS).map(([type, r]) => `
            <button class="reaction-btn ${userReaction === type ? 'active reaction-active-' + type : ''}"
                data-post-id="${post.id}" data-reaction="${type}" title="${r.label}">
                <span class="reaction-emoji">${r.emoji}</span>
                <span class="reaction-count">${post.reactions[type].length}</span>
            </button>`).join('');

        return `
        <article class="post-card" data-post-id="${post.id}">

            <div class="post-card-header">
                <a href="profile.html?id=${author.id}" class="post-author-link">
                    ${this.renderAvatar(author, 'sm')}
                    <div class="post-author-info">
                        <span class="post-author-name">@${escapeHtml(author.username)}</span>
                        <span class="post-timestamp">${formatDate(post.createdAt)}</span>
                    </div>
                </a>
                <div class="post-meta-right">
                    <span class="category-badge cat-${post.category}">${cat.label}</span>
                    ${isOwner ? `
                    <button class="btn-icon-danger delete-post-btn"
                        data-post-id="${post.id}"
                        title="Delete post" aria-label="Delete post">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                        </svg>
                    </button>` : ''}
                </div>
            </div>

            <div class="post-content">${escapeHtml(post.content)}</div>

            <div class="post-footer">
                <div class="reaction-group">${reactionsHtml}</div>
                <button class="comment-btn comment-toggle-btn" data-post-id="${post.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                    </svg>
                    <span>${post.comments.length}</span>
                </button>
            </div>

            <div class="comments-section" style="display:none">
                <div class="comments-list">
                    ${commentsHtml || '<p class="no-comments">No comments yet.</p>'}
                </div>
                <div class="comment-form">
                    <div class="comment-avatar">${this.renderAvatar(currentUser, 'xs')}</div>
                    <input type="text" class="comment-input"
                        data-post-id="${post.id}"
                        placeholder="Write a comment…" maxlength="300">
                    <button class="comment-submit-btn" data-post-id="${post.id}">Post</button>
                </div>
            </div>

        </article>`;
    },

    /* show a brief toast notification at the bottom of the screen */
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


/*  POST EVENT DELEGATION  */
/* Handles all post-related interactions (reactions, comments, deletes) via event delegation.
This allows us to attach a single event listener to the post list container, 
and it will work for all current and future posts without needing to re-attach listeners after rendering. */

function attachPostEvents(container, currentUser, onRefresh) {
    if (!container) return;
    if (container.dataset.eventsBound === 'true') return;
    container.dataset.eventsBound = 'true';

    /* all clicks are handled here via delegation */
    container.addEventListener('click', e => {

        /* reaction buttons */
        const reactionBtn = e.target.closest('.reaction-btn');
        if (reactionBtn) {
            e.preventDefault();
            const postId = reactionBtn.dataset.postId;
            const reaction = reactionBtn.dataset.reaction;
            Posts.toggleReaction(postId, currentUser.id, reaction);
            if (onRefresh) { onRefresh(); return; }
            /* in-place card swap so the feed does not fully re-render */
            const post = Posts.getById(postId);
            if (!post) return;
            const card = container.querySelector(`[data-post-id="${postId}"]`);
            if (!card) return;
            const tmp = document.createElement('div');
            tmp.innerHTML = UI.renderPostCard(post, currentUser);
            const newEl = tmp.firstElementChild;
            card.replaceWith(newEl);
            attachPostEvents(newEl, currentUser, null);
            return;
        }

        /* toggle the comment section open or closed */
        const toggleBtn = e.target.closest('.comment-toggle-btn');
        if (toggleBtn) {
            e.preventDefault();

            const postCard = toggleBtn.closest('.post-card');
            if (!postCard) return;

            const section = postCard.querySelector('.comments-section');
            if (!section) return;

            const isOpen = section.style.display !== 'none';
            section.style.display = isOpen ? 'none' : 'block';

            if (!isOpen) {
                section.querySelector('.comment-input')?.focus();
            }
            return;
        }

        /* submit a new comment */
        const submitBtn = e.target.closest('.comment-submit-btn');
        if (submitBtn) {
            e.preventDefault();

            const postId = submitBtn.dataset.postId;
            const postCard = submitBtn.closest('.post-card');
            if (!postCard) return;

            const input = postCard.querySelector(`.comment-input[data-post-id="${postId}"]`);
            if (input && input.value.trim()) {
                Posts.addComment(postId, currentUser.id, input.value);
                if (onRefresh) onRefresh();
            }
            return;
        }

        /* delete a comment */
        const commentDeleteBtn = e.target.closest('.comment-delete-btn');
        if (commentDeleteBtn) {
            if (!confirm('Delete this comment?')) return;
            const { postId, commentId } = commentDeleteBtn.dataset;
            Posts.deleteComment(postId, commentId, currentUser.id);
            if (onRefresh) onRefresh();
            return;
        }

        /* delete a post */
        const deleteBtn = e.target.closest('.delete-post-btn');
        if (deleteBtn) {
            e.stopPropagation();
            if (!confirm('Delete this post? This cannot be undone.')) return;
            const postId = deleteBtn.dataset.postId;
            Posts.delete(postId, currentUser.id);
            UI.showToast('Post deleted');
            if (onRefresh) onRefresh();
            else container.querySelector(`[data-post-id="${postId}"]`)?.remove();
            return;
        }
    });

    /* submit comment on Enter key */
    container.addEventListener('keydown', e => {
        if (e.key === 'Enter' && e.target.classList.contains('comment-input')) {
            e.preventDefault();
            const postId = e.target.dataset.postId;
            const submitBtn = container.querySelector(`.comment-submit-btn[data-post-id="${postId}"]`);
            if (submitBtn) submitBtn.click();
        }
    });
}


/* NAVBAR SETUP */

function setupNavbar(currentUser) {
    const avatar = document.getElementById('navbar-avatar');
    const username = document.getElementById('navbar-username');
    const link = document.getElementById('navbar-ProfileLink');
    const logout = document.getElementById('logoutBtn');

    if (avatar) avatar.innerHTML = UI.renderAvatar(currentUser, 'xs');
    if (username) username.textContent = '@' + currentUser.username;
    if (link) link.href = `profile.html?id=${currentUser.id}`;
    if (logout) logout.addEventListener('click', () => {
        if (confirm('Log out of Creativo?')) Auth.logout();
    });

    /* search bar: only present on feed page */
    const searchInput = document.getElementById('navSearch');
    const searchResults = document.getElementById('searchResults');
    if (searchInput && searchResults) {
        searchInput.addEventListener('input', () => {
            const q = searchInput.value.trim().toLowerCase();
            if (!q) { searchResults.style.display = 'none'; return; }
            const users = Users.getAll().filter(u =>
                u.username.toLowerCase().includes(q)
            );
            if (users.length === 0) { searchResults.style.display = 'none'; return; }
            searchResults.innerHTML = users.slice(0, 5).map(u => `
                <a href="profile.html?id=${u.id}" class="search-result-item">
                    ${UI.renderAvatar(u, 'xs')}
                    <span>@${escapeHtml(u.username)}</span>
                </a>`).join('');
            searchResults.style.display = 'block';
        });

        document.addEventListener('click', e => {
            if (!searchInput.contains(e.target)) searchResults.style.display = 'none';
        });
    }
}