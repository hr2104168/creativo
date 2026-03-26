/* profile.js — Creativo
   Profile page logic: render card, posts, edit modal, follow.
   Depends on: storage.js loaded first. */


/*   PAGE INIT */

document.addEventListener('DOMContentLoaded', () => {
    initProfilePage();
});

function initProfilePage() {
    /* require a logged-in session */
    const currentUser = Auth.requireAuth();
    if (!currentUser) return;

    /* whose profile to show — own profile if no ?id param */
    const params     = new URLSearchParams(window.location.search);
    const targetId   = params.get('id') || currentUser.id;
    const isOwn      = targetId === currentUser.id;
    const profileUser = Users.getById(targetId);

    if (!profileUser) {
        document.body.innerHTML = '<p style="padding:40px;font-family:sans-serif">User not found.</p>';
        return;
    }

    /* set up shared navbar */
    setupNavbar(currentUser);

    /* render the profile card and posts list */
    renderProfileCard(profileUser, currentUser, isOwn);
    renderProfilePosts(profileUser, currentUser, isOwn);

    /* attach edit modal events only on the user's own profile */
    if (isOwn) attachEditProfileEvents(currentUser);
}


/*  PROFILE CARD  */

function renderProfileCard(profileUser, currentUser, isOwn) {
    /* avatar */
    const avatarEl = document.getElementById('profileAvatar');
    if (avatarEl) avatarEl.innerHTML = UI.renderAvatar(profileUser, 'lg');

    /* name and handle */
    const nameEl   = document.getElementById('profileName');
    const handleEl = document.getElementById('profileHandle');
    if (nameEl)   nameEl.textContent   = profileUser.username;
    if (handleEl) handleEl.textContent = '@' + profileUser.username;

    /* bio text */
    const bioEl = document.getElementById('profileBio');
    if (bioEl) bioEl.textContent = profileUser.bio || 'No bio yet.';

    /* stats: posts, followers, following */
    const posts     = Posts.getByUser(profileUser.id);
    const allUsers  = Users.getAll();
    const followers = allUsers.filter(u => u.following && u.following.includes(profileUser.id)).length;
    const following = profileUser.following ? profileUser.following.length : 0;

    const postCountEl      = document.getElementById('postCount');
    const followerCountEl  = document.getElementById('followerCount');
    const followingCountEl = document.getElementById('followingCount');
    if (postCountEl)      postCountEl.textContent      = posts.length;
    if (followerCountEl)  followerCountEl.textContent  = followers;
    if (followingCountEl) followingCountEl.textContent = following;

    /* join date */
    const joinEl = document.getElementById('joinDate');
    if (joinEl && profileUser.createdAt) {
        const d = new Date(profileUser.createdAt);
        joinEl.textContent = 'Joined ' + d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    /* show edit button on own profile, follow button on others */
    const editBtn   = document.getElementById('editProfileBtn');
    const followBtn = document.getElementById('followBtn');

    /* hide the edit bio button on other people's profiles */
    const editBioBtn = document.getElementById('editBioBtn');
    if (editBioBtn) editBioBtn.style.display = isOwn ? 'inline-flex' : 'none';

    if (isOwn) {
        if (editBtn) editBtn.style.display = 'flex';
    } else {
        if (followBtn) {
            followBtn.style.display = 'flex';
            updateFollowBtn(followBtn, currentUser, profileUser.id);
            followBtn.addEventListener('click', () => {
                handleFollow(followBtn, currentUser, profileUser.id);
                /* refresh follower count after follow/unfollow */
                const updated = Users.getAll()
                    .filter(u => u.following && u.following.includes(profileUser.id)).length;
                if (followerCountEl) followerCountEl.textContent = updated;
            });
        }
    }

    /* posts section heading */
    const heading = document.getElementById('postsHeading');
    if (heading) heading.textContent = isOwn
        ? '✨ My Creations'
        : `✨ ${profileUser.username}'s Posts`;
}


/* FOLLOW / UNFOLLOW  */

function updateFollowBtn(btn, currentUser, targetId) {
    const isFollowing = Users.isFollowing(currentUser.id, targetId);
    btn.textContent        = isFollowing ? 'Following' : 'Follow';
    btn.dataset.following  = isFollowing;
    btn.classList.toggle('following', isFollowing);
}

function handleFollow(btn, currentUser, targetId) {
    const isFollowing = btn.dataset.following === 'true';
    if (isFollowing) {
        Users.unfollow(currentUser.id, targetId);
        UI.showToast('Unfollowed');
    } else {
        Users.follow(currentUser.id, targetId);
        UI.showToast('Now following ✨');
    }
    /* re-read from storage so the button reflects the saved state */
    updateFollowBtn(btn, Storage.getCurrentUser(), targetId);
}


/* POSTS LIST  */

function renderProfilePosts(profileUser, currentUser, isOwn) {
    const listEl = document.getElementById('postsList');
    if (!listEl) return;

    const posts = Posts.getByUser(profileUser.id);
    listEl.innerHTML = '';

    if (posts.length === 0) {
        listEl.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🌱</div>
                <h3>No posts yet</h3>
                <p>${isOwn
                    ? 'Head to the feed to share your first creation!'
                    : "This creator hasn't posted yet."}</p>
                ${isOwn ? `<a href="feed.html" class="btn btn-primary">Go to Feed</a>` : ''}
            </div>`;
        return;
    }

    posts.forEach(post => { listEl.innerHTML += UI.renderPostCard(post, currentUser); });

    /* attach reaction, comment, and delete event handlers */
    attachPostEvents(listEl, currentUser, () =>
        renderProfilePosts(profileUser, currentUser, isOwn)
    );
}


/*  EDIT PROFILE MODAL  */

function attachEditProfileEvents(currentUser) {
    const editProfileBtn = document.getElementById('editProfileBtn');
    const editBioBtn     = document.getElementById('editBioBtn');
    const editAvatarBtn  = document.getElementById('editAvatarBtn');
    const closeModalBtn  = document.getElementById('closeModalBtn');
    const cancelEditBtn  = document.getElementById('cancelEditBtn');
    const editForm       = document.getElementById('editProfileForm');
    const modal          = document.getElementById('editProfileModal');

    /* populate and open the modal */
    const openEditModal = () => {
        document.getElementById('editUsername').value  = currentUser.username;
        document.getElementById('editBio').value       = currentUser.bio || '';
        document.getElementById('editAvatarUrl').value = '';
        modal.classList.add('active');
    };

    if (editProfileBtn) editProfileBtn.addEventListener('click', openEditModal);
    if (editBioBtn)     editBioBtn.addEventListener('click', openEditModal);
    if (editAvatarBtn)  editAvatarBtn.addEventListener('click', openEditModal);

    /* close the modal */
    const closeEditModal = () => modal.classList.remove('active');

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeEditModal);
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', closeEditModal);

    /* close on backdrop click */
    if (modal) modal.addEventListener('click', e => {
        if (e.target === e.currentTarget) closeEditModal();
    });

    /* form submit — validate and save changes to localStorage */
    if (editForm) {
        editForm.addEventListener('submit', e => {
            e.preventDefault();

            const newUsername  = document.getElementById('editUsername').value.trim();
            const newBio       = document.getElementById('editBio').value.trim();
            const newAvatarUrl = document.getElementById('editAvatarUrl').value.trim();

            /* validate username length */
            if (!newUsername || newUsername.length < 3) {
                UI.showToast('Username must be at least 3 characters.', 'error');
                return;
            }

            const users = Storage.getUsers();

            /* check for duplicate username (excluding the current user) */
            const taken = users.some(u =>
                u.id !== currentUser.id &&
                u.username.toLowerCase() === newUsername.toLowerCase()
            );
            if (taken) {
                UI.showToast('That username is already taken.', 'error');
                return;
            }

            /* apply changes */
            const idx = users.findIndex(u => u.id === currentUser.id);
            if (idx === -1) return;

            users[idx].username = newUsername;
            users[idx].bio      = newBio;
            if (newAvatarUrl) users[idx].profilePicture = newAvatarUrl;

            Storage.setUsers(users);

            closeEditModal();
            UI.showToast('Profile updated ✨');

            /* short delay so the user sees the toast before reload */
            setTimeout(() => window.location.reload(), 800);
        });
    }
}