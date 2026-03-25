
// CREATIVO - User Profile Module
// Handles Profile Data with localStorage
// Storage Keys
const STORAGE_KEYS = {
    USERS: 'creativo_users',
    POSTS: 'creativo_posts',
    LIKES: 'creativo_likes',
    COMMENTS: 'creativo_comments',
    FOLLOWS: 'creativo_follows',
    SESSION: 'creativo_session'
};

// Storage Manager

class ProfileStorage {
    static get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Error reading ${key}:`, error);
            return null;
        }
    }

    static set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Error writing ${key}:`, error);
            return false;
        }
    }

    static getUsers() {
        return this.get(STORAGE_KEYS.USERS) || [];
    }

    static saveUsers(users) {
        return this.set(STORAGE_KEYS.USERS, users);
    }

    static getPosts() {
        return this.get(STORAGE_KEYS.POSTS) || [];
    }

    static savePosts(posts) {
        return this.set(STORAGE_KEYS.POSTS, posts);
    }

    static getLikes() {
        return this.get(STORAGE_KEYS.LIKES) || {};
    }

    static saveLikes(likes) {
        return this.set(STORAGE_KEYS.LIKES, likes);
    }

    static getComments() {
        return this.get(STORAGE_KEYS.COMMENTS) || {};
    }

    static saveComments(comments) {
        return this.set(STORAGE_KEYS.COMMENTS, comments);
    }

    static getFollows() {
        return this.get(STORAGE_KEYS.FOLLOWS) || {};
    }

    static saveFollows(follows) {
        return this.set(STORAGE_KEYS.FOLLOWS, follows);
    }

    static getSession() {
        return this.get(STORAGE_KEYS.SESSION);
    }

    static saveSession(userId) {
        return this.set(STORAGE_KEYS.SESSION, { userId, timestamp: new Date().toISOString() });
    }

    static clearSession() {
        return this.remove(STORAGE_KEYS.SESSION);
    }

    static remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error removing ${key}:`, error);
            return false;
        }
    }

    static getCurrentUser() {
        const session = this.getSession();
        if (!session) return null;
        const users = this.getUsers();
        return users.find(user => user.id === session.userId) || null;
    }
}

// ============================================
// Profile Manager Class
// ============================================

class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.currentUser = ProfileStorage.getCurrentUser();
        
        if (!this.currentUser) {
            this.createDemoSession();
        }
        
        this.loadProfile();
        this.attachEvents();
    }

    createDemoSession() {
        // Initialize demo data if empty
        let users = ProfileStorage.getUsers();
        
        if (users.length === 0) {
            // Create demo users
            const demoUsers = [
                {
                    id: 'user_1',
                    username: 'creativo',
                    email: 'hello@creativo.com',
                    password: 'creativo123',
                    bio: '✨ Welcome to Creativo! A space for creative minds to share and inspire ✨',
                    profilePic: 'https://ui-avatars.com/api/?background=7F77DD&color=fff&bold=true&size=140&name=CR',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 'user_2',
                    username: 'lunarose',
                    email: 'luna@creativo.com',
                    password: 'luna123',
                    bio: '🌙 Dreamer | Artist | Storyteller',
                    profilePic: 'https://ui-avatars.com/api/?background=7F77DD&color=fff&bold=true&size=140&name=LR',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 'user_3',
                    username: 'solwriter',
                    email: 'sol@creativo.com',
                    password: 'sol123',
                    bio: '☀️ Writing my way through life | Poetry & Prose',
                    profilePic: 'https://ui-avatars.com/api/?background=7F77DD&color=fff&bold=true&size=140&name=SW',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ];
            users = demoUsers;
            ProfileStorage.saveUsers(users);
            
            // Create demo posts
            const demoPosts = [
                {
                    id: 'post_1',
                    userId: 'user_1',
                    content: 'Welcome to Creativo! 🎨 This is a space where creativity meets community. Share your thoughts, inspire others, and let your imagination run wild! ✨',
                    timestamp: new Date(Date.now() - 86400000).toISOString(),
                    edited: false,
                    editedAt: null
                },
                {
                    id: 'post_2',
                    userId: 'user_2',
                    content: 'Just finished a new painting. Art is how I make sense of the world. What inspires you today? 🎨🌙',
                    timestamp: new Date(Date.now() - 43200000).toISOString(),
                    edited: false,
                    editedAt: null
                },
                {
                    id: 'post_3',
                    userId: 'user_3',
                    content: 'The moon tonight is a perfect crescent. It reminds me that even in darkness, there is always light. ☀️🌙',
                    timestamp: new Date(Date.now() - 21600000).toISOString(),
                    edited: false,
                    editedAt: null
                },
                {
                    id: 'post_4',
                    userId: 'user_1',
                    content: 'Creativity is intelligence having fun. What are you creating today? 💫',
                    timestamp: new Date(Date.now() - 7200000).toISOString(),
                    edited: false,
                    editedAt: null
                }
            ];
            ProfileStorage.savePosts(demoPosts);
            
            // Create demo likes
            const demoLikes = {
                'post_1': ['user_2', 'user_3'],
                'post_2': ['user_1', 'user_3'],
                'post_3': ['user_1', 'user_2']
            };
            ProfileStorage.saveLikes(demoLikes);
            
            // Create demo follows
            const demoFollows = {
                'user_1': ['user_2', 'user_3'],
                'user_2': ['user_1', 'user_3'],
                'user_3': ['user_1', 'user_2']
            };
            ProfileStorage.saveFollows(demoFollows);
        }
        
        // Create session for first user
        ProfileStorage.saveSession(users[0].id);
        this.currentUser = users[0];
    }

    loadProfile() {
        // Update profile information
        document.getElementById('profileName').textContent = this.currentUser.username;
        document.getElementById('profileUsername').textContent = `@${this.currentUser.username}`;
        document.getElementById('profileBio').textContent = this.currentUser.bio || '✨ No bio yet. Click edit to add something lovely.';
        document.getElementById('profileAvatar').src = this.currentUser.profilePic;
        
        // Set join date
        const joinDate = new Date(this.currentUser.createdAt);
        document.getElementById('joinDate').textContent = `Joined ${joinDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
        
        // Load stats
        this.loadStats();
        
        // Load user's posts
        this.loadUserPosts();
    }

    loadStats() {
        // Get user's posts count
        const allPosts = ProfileStorage.getPosts();
        const userPosts = allPosts.filter(post => post.userId === this.currentUser.id);
        document.getElementById('postCount').textContent = userPosts.length;
        
        // Get followers count
        const follows = ProfileStorage.getFollows();
        let followers = 0;
        Object.keys(follows).forEach(followerId => {
            if (follows[followerId] && follows[followerId].includes(this.currentUser.id)) {
                followers++;
            }
        });
        document.getElementById('followerCount').textContent = followers;
        
        // Get following count
        const following = follows[this.currentUser.id] || [];
        document.getElementById('followingCount').textContent = following.length;
    }

    loadUserPosts() {
        const allPosts = ProfileStorage.getPosts();
        const userPosts = allPosts
            .filter(post => post.userId === this.currentUser.id)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        const postsGrid = document.getElementById('postsGrid');
        
        if (userPosts.length === 0) {
            postsGrid.innerHTML = `
                <div class="empty-posts">
                    <p>🌸 No posts yet. Click "New Post" to share your first creation!</p>
                </div>
            `;
            return;
        }
        
        postsGrid.innerHTML = userPosts.map(post => this.renderPostCard(post)).join('');
        this.attachPostEvents();
    }

    renderPostCard(post) {
        const likes = ProfileStorage.getLikes();
        const likeCount = likes[post.id] ? likes[post.id].length : 0;
        const comments = ProfileStorage.getComments();
        const commentCount = comments[post.id] ? comments[post.id].length : 0;
        const timeAgo = this.getTimeAgo(new Date(post.timestamp));
        
        return `
            <div class="post-card" data-post-id="${post.id}">
                <div class="post-header">
                    <img class="post-avatar" src="${this.currentUser.profilePic}" alt="${this.currentUser.username}">
                    <div class="post-author-info">
                        <div class="post-author-name">${this.escapeHtml(this.currentUser.username)}</div>
                        <div class="post-time">${timeAgo}</div>
                    </div>
                </div>
                <div class="post-content">${this.escapeHtml(post.content)}</div>
                <div class="post-actions">
                    <button class="action-btn like-btn ${this.hasUserLiked(post.id) ? 'liked' : ''}" data-post-id="${post.id}">
                        ❤️ <span class="like-count">${likeCount}</span>
                    </button>
                    <button class="action-btn comment-btn" data-post-id="${post.id}">
                        💬 <span class="comment-count">${commentCount}</span>
                    </button>
                    <button class="action-btn delete-btn" data-post-id="${post.id}">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `;
    }

    hasUserLiked(postId) {
        const likes = ProfileStorage.getLikes();
        return likes[postId] && likes[postId].includes(this.currentUser.id);
    }

    attachPostEvents() {
        // Like buttons
        document.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const postId = btn.dataset.postId;
                this.toggleLike(postId);
            });
        });
        
        // Delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const postId = btn.dataset.postId;
                if (confirm('Are you sure you want to delete this post?')) {
                    this.deletePost(postId);
                }
            });
        });
        
        // Comment buttons
        document.querySelectorAll('.comment-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showCommentDialog(btn.dataset.postId);
            });
        });
    }

    toggleLike(postId) {
        const likes = ProfileStorage.getLikes();
        
        if (!likes[postId]) {
            likes[postId] = [];
        }
        
        const userIndex = likes[postId].indexOf(this.currentUser.id);
        
        if (userIndex === -1) {
            // Like the post
            likes[postId].push(this.currentUser.id);
            this.showMessage('Post liked!', 'success');
        } else {
            // Unlike the post
            likes[postId].splice(userIndex, 1);
            this.showMessage('Post unliked', 'success');
        }
        
        ProfileStorage.saveLikes(likes);
        
        // Refresh posts to update like counts
        this.loadUserPosts();
    }

    deletePost(postId) {
        let posts = ProfileStorage.getPosts();
        posts = posts.filter(post => post.id !== postId);
        ProfileStorage.savePosts(posts);
        
        // Also remove likes for this post
        const likes = ProfileStorage.getLikes();
        delete likes[postId];
        ProfileStorage.saveLikes(likes);
        
        // Also remove comments for this post
        const comments = ProfileStorage.getComments();
        delete comments[postId];
        ProfileStorage.saveComments(comments);
        
        // Refresh posts and stats
        this.loadUserPosts();
        this.loadStats();
        
        this.showMessage('Post deleted successfully!', 'success');
    }

    createPost(content) {
        if (!content.trim()) {
            this.showMessage('Please write something before posting.', 'error');
            return false;
        }
        
        const posts = ProfileStorage.getPosts();
        const newPost = {
            id: 'post_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            userId: this.currentUser.id,
            content: content.trim(),
            timestamp: new Date().toISOString(),
            edited: false,
            editedAt: null
        };
        
        posts.push(newPost);
        ProfileStorage.savePosts(posts);
        
        // Refresh posts
        this.loadUserPosts();
        this.loadStats();
        
        return true;
    }

    updateProfile(username, bio, avatarUrl) {
        const users = ProfileStorage.getUsers();
        const userIndex = users.findIndex(u => u.id === this.currentUser.id);
        
        if (userIndex === -1) {
            this.showMessage('Error updating profile.', 'error');
            return false;
        }
        
        // Check if username is taken 
        const usernameTaken = users.some(u => u.id !== this.currentUser.id && u.username === username);
        if (usernameTaken) {
            this.showMessage('Username already taken. Please choose another.', 'error');
            return false;
        }
        
        // Update user data
        users[userIndex].username = username;
        users[userIndex].bio = bio || '';
        if (avatarUrl && avatarUrl.trim()) {
            users[userIndex].profilePic = avatarUrl.trim();
        }
        users[userIndex].updatedAt = new Date().toISOString();
        
        ProfileStorage.saveUsers(users);
        
        // Update current user
        this.currentUser = users[userIndex];
        
        // Refresh display
        this.loadProfile();
        
        return true;
    }

    addComment(postId, commentText) {
        if (!commentText.trim()) {
            this.showMessage('Please write a comment.', 'error');
            return false;
        }
        
        const comments = ProfileStorage.getComments();
        
        if (!comments[postId]) {
            comments[postId] = [];
        }
        
        const newComment = {
            id: 'comment_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            userId: this.currentUser.id,
            username: this.currentUser.username,
            text: commentText.trim(),
            timestamp: new Date().toISOString()
        };
        
        comments[postId].push(newComment);
        ProfileStorage.saveComments(comments);
        
        this.showMessage('Comment added!', 'success');
        
        // Refresh posts to update comment counts
        this.loadUserPosts();
        
        return true;
    }

    showCommentDialog(postId) {
        const comment = prompt('Write your comment:');
        if (comment !== null) {
            this.addComment(postId, comment);
        }
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        
        if (diffSec < 60) return 'just now';
        if (diffMin < 60) return `${diffMin}m ago`;
        if (diffHour < 24) return `${diffHour}h ago`;
        if (diffDay < 7) return `${diffDay}d ago`;
        
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showMessage(message, type) {
        // Create temporary message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `${type}-message`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            background: ${type === 'success' ? '#4CAF50' : '#f44336'};
            color: white;
            z-index: 2000;
            animation: fadeIn 0.3s ease;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(messageDiv);
            }, 300);
        }, 3000);
    }

    // Event Handlers
  

    attachEvents() {
        // Edit Profile Button
        const editProfileBtn = document.getElementById('editProfileBtn');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => {
                this.openEditProfileModal();
            });
        }
        
        // Edit Bio Button
        const editBioBtn = document.getElementById('editBioBtn');
        if (editBioBtn) {
            editBioBtn.addEventListener('click', () => {
                this.openEditProfileModal();
            });
        }
        
        // Edit Avatar Button
        const editAvatarBtn = document.getElementById('editAvatarBtn');
        if (editAvatarBtn) {
            editAvatarBtn.addEventListener('click', () => {
                this.openEditProfileModal();
            });
        }
        
        // Create Post Button
        const createPostBtn = document.getElementById('createPostBtn');
        if (createPostBtn) {
            createPostBtn.addEventListener('click', () => {
                this.openCreatePostModal();
            });
        }
        
        // Logout Button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to logout?')) {
                    ProfileStorage.clearSession();
                    this.showMessage('Logged out successfully!', 'success');
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                }
            });
        }
        
        // Modal Close Buttons
        const closeModalBtn = document.getElementById('closeModalBtn');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                this.closeModal('editProfileModal');
            });
        }
        
        const cancelEditBtn = document.getElementById('cancelEditBtn');
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => {
                this.closeModal('editProfileModal');
            });
        }
        
        const closePostModalBtn = document.getElementById('closePostModalBtn');
        if (closePostModalBtn) {
            closePostModalBtn.addEventListener('click', () => {
                this.closeModal('createPostModal');
            });
        }
        
        const cancelPostBtn = document.getElementById('cancelPostBtn');
        if (cancelPostBtn) {
            cancelPostBtn.addEventListener('click', () => {
                this.closeModal('createPostModal');
            });
        }
        
        // Edit Profile Form Submit
        const editProfileForm = document.getElementById('editProfileForm');
        if (editProfileForm) {
            editProfileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const username = document.getElementById('editUsername').value.trim();
                const bio = document.getElementById('editBio').value;
                const avatarUrl = document.getElementById('editAvatarUrl').value;
                
                if (!username) {
                    this.showMessage('Username is required.', 'error');
                    return;
                }
                
                if (this.updateProfile(username, bio, avatarUrl)) {
                    this.closeModal('editProfileModal');
                    this.showMessage('Profile updated successfully!', 'success');
                }
            });
        }
        
        // Create Post Form Submit
        const createPostForm = document.getElementById('createPostForm');
        if (createPostForm) {
            createPostForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const content = document.getElementById('postContent').value;
                
                if (this.createPost(content)) {
                    this.closeModal('createPostModal');
                    document.getElementById('postContent').value = '';
                    this.showMessage('Post created successfully!', 'success');
                }
            });
        }
        
        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList && e.target.classList.contains('modal')) {
                e.target.classList.remove('active');
            }
        });
    }

    openEditProfileModal() {
        // Populate form with current data
        const usernameInput = document.getElementById('editUsername');
        const bioTextarea = document.getElementById('editBio');
        const avatarInput = document.getElementById('editAvatarUrl');
        
        if (usernameInput) usernameInput.value = this.currentUser.username;
        if (bioTextarea) bioTextarea.value = this.currentUser.bio || '';
        if (avatarInput) avatarInput.value = '';
        
        this.openModal('editProfileModal');
    }

    openCreatePostModal() {
        const postContent = document.getElementById('postContent');
        if (postContent) postContent.value = '';
        this.openModal('createPostModal');
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }
}

// Initialize the Application

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    new ProfileManager();
});