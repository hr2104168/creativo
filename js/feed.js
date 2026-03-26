
/*   PAGE INIT    */
document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.dataset.page;
    if (page === 'feed') initFeedPage();
});


/*   FEED PAGE    */
function initFeedPage() {
    /* require a logged-in session */
    const currentUser = Auth.requireAuth();
    if (!currentUser) return;

    let activeFilter = 'all';
    let activeTab    = 'feed'; // 'feed' or 'explore'

    /* shared navbar */
    setupNavbar(currentUser);

    /* render the current user's avatar in the post creation box */
    const createAvatar = document.getElementById('createAvatar');
    if (createAvatar) createAvatar.innerHTML = UI.renderAvatar(currentUser, 'sm');

    /* tab switching */
    const tabFeed    = document.getElementById('tabFeed');
    const tabExplore = document.getElementById('tabExplore');
    tabFeed.addEventListener('click',    () => { activeTab = 'feed';    renderFeedTab(); });
    tabExplore.addEventListener('click', () => { activeTab = 'explore'; renderExploreTab(); });

    /* category sidebar filter */
    document.querySelectorAll('.cat-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.cat-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilter = btn.dataset.cat;
            if (activeTab === 'feed') renderFeedTab();
            else renderExploreTab();
        });
    });

    /* post creation — textarea, char counter, category selector */
    const postTextarea   = document.getElementById('postContent');
    const charCount      = document.getElementById('charCount');
    const categoryBtns   = document.querySelectorAll('.cat-select-btn');
    const submitPost     = document.getElementById('submitPost');
    let   selectedCategory = 'poetry';

    /* select the default category */
    document.querySelector('[data-cat-select="poetry"]').classList.add('selected');

    /* update char counter as the user types */
    postTextarea.addEventListener('input', () => {
        const len = postTextarea.value.length;
        charCount.textContent = 200 - len;
        charCount.classList.toggle('over', len > 200);
        if (len > 200) {
            postTextarea.value    = postTextarea.value.slice(0, 200);
            charCount.textContent = 0;
        }
    });

    /* switch selected category */
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedCategory = btn.dataset.catSelect;
        });
    });

    /* submit a new post */
    submitPost.addEventListener('click', () => {
        const content = postTextarea.value.trim();
        if (!content) { UI.showToast('Write something creative first! ✨', 'error'); return; }
        if (content.length > 200) { UI.showToast('Keep it under 200 characters!', 'error'); return; }

        Posts.create(currentUser.id, content, selectedCategory);
        postTextarea.value    = '';
        charCount.textContent = 200;
        UI.showToast('Your creation is live! ✨');
        renderFeedTab();
    });

    /* Ctrl+Enter also submits */
    postTextarea.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') submitPost.click();
    });


    /*RENDER TABS */

    function renderFeedTab() {
        tabFeed.classList.add('active');
        tabExplore.classList.remove('active');

        const feedEl    = document.getElementById('feedContainer');
        const exploreEl = document.getElementById('exploreContainer');
        feedEl.style.display    = 'block';
        exploreEl.style.display = 'none';

        /* get posts from followed users + own; apply category filter */
        let posts = Posts.getFeed(currentUser.id);
        if (activeFilter !== 'all') posts = posts.filter(p => p.category === activeFilter);

        feedEl.innerHTML = '';
        if (posts.length === 0) {
            feedEl.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🌱</div>
                    <h3>Nothing here yet</h3>
                    <p>${activeFilter !== 'all'
                        ? 'No posts in this category from people you follow.'
                        : 'Follow some creators to see their posts here!'}</p>
                    <button class="post-button"
                        onclick="document.getElementById('tabExplore').click()">
                        Discover Creators
                    </button>
                </div>`;
            return;
        }

        posts.forEach(post => { feedEl.innerHTML += UI.renderPostCard(post, currentUser); });
        attachPostEvents(feedEl, currentUser, renderFeedTab);
    }

    function renderExploreTab() {
        tabFeed.classList.remove('active');
        tabExplore.classList.add('active');

        const feedEl    = document.getElementById('feedContainer');
        const exploreEl = document.getElementById('exploreContainer');
        feedEl.style.display    = 'none';
        exploreEl.style.display = 'block';

        /* all posts (not just followed); apply category filter */
        let posts = Posts.getAll();
        if (activeFilter !== 'all') posts = posts.filter(p => p.category === activeFilter);

        /* re-render discover sidebar to reflect latest follow state */
        renderExploreSidebar(currentUser);

        const postsEl = document.getElementById('explorePosts');
        postsEl.innerHTML = '';
        if (posts.length === 0) {
            postsEl.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🎭</div>
                    <h3>No posts yet</h3>
                    <p>Be the first to create!</p>
                </div>`;
            return;
        }

        posts.forEach(post => { postsEl.innerHTML += UI.renderPostCard(post, currentUser); });
        attachPostEvents(postsEl, currentUser, renderExploreTab);
    }


    /* DISCOVER SIDEBAR */
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
            const postCount   = Posts.getByUser(u.id).length;
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

        /* attach follow/unfollow events to each sidebar button */
        sidebarEl.querySelectorAll('.btn-follow').forEach(btn => {
            btn.addEventListener('click', () => handleSidebarFollow(btn, currentUser));
        });
    }

    /* follow or unfollow from the discover sidebar */
    function handleSidebarFollow(btn, currentUser) {
        const targetId    = btn.dataset.userId;
        const isFollowing = btn.dataset.following === 'true';

        if (isFollowing) {
            Users.unfollow(currentUser.id, targetId);
            btn.textContent      = 'Follow';
            btn.dataset.following = 'false';
            btn.classList.remove('following');
            UI.showToast('Unfollowed');
        } else {
            Users.follow(currentUser.id, targetId);
            btn.textContent      = 'Following';
            btn.dataset.following = 'true';
            btn.classList.add('following');
            UI.showToast('Now following ✨');
        }

        /* refresh the feed so new posts appear immediately */
        if (activeTab === 'feed') renderFeedTab();
    }

    function renderExploreSidebar(currentUser) {
    const contentEl = document.querySelector('#exploreSidebar .sidebar-content');
    if (!contentEl) return;

    const allUsers = Users.getAll().filter(u => u.id !== currentUser.id);
    contentEl.innerHTML = ''; // clear previous content

    if (allUsers.length === 0) {
        contentEl.innerHTML = '<p class="sidebar-empty">No other users yet.</p>';
        return;
    }

    allUsers.forEach(u => {
        const isFollowing = Users.isFollowing(currentUser.id, u.id);
        const postCount   = Posts.getByUser(u.id).length;
        contentEl.innerHTML += `
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

    /* attach follow/unfollow events */
    contentEl.querySelectorAll('.btn-follow').forEach(btn => {
        btn.addEventListener('click', () => handleSidebarFollow(btn, currentUser));
    });
}

    /* INITIAL RENDER */
    renderFeedTab();
    renderExploreSidebar(currentUser);
}