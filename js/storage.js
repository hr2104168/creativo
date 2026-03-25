


/* INITIALISE STORAGE */

// set up keys in localStorage if they don't exist yet
function initStorage() {
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([]));
    }
    if (!localStorage.getItem('posts')) {
        localStorage.setItem('posts', JSON.stringify([]));
    }
}


/* ID GENERATOR */

// creates a unique id like "234_abc"
function generateId(prefix) {
    return prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}


/* USER HELPERS */

// get all users from localStorage
function getUsers() {
    return JSON.parse(localStorage.getItem('users')) || [];
}

// save the full users array back to localStorage
function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

// find one user by their id
function getUserById(id) {
    return getUsers().find(function(u) {
        return u.id === id;
    }) || null;
}

// find one user by their username
function getUserByUsername(username) {
    return getUsers().find(function(u) {
        return u.username.toLowerCase() === username.toLowerCase();
    }) || null;
}


/* POST HELPERS */

// get all posts from localStorage
function getPosts() {
    return JSON.parse(localStorage.getItem('posts')) || [];
}

// save the full posts array back to localStorage
function savePosts(posts) {
    localStorage.setItem('posts', JSON.stringify(posts));
}


/* SESSION HELPERS */

// get the currently logged in user
function getLoggedInUser() {
    return JSON.parse(localStorage.getItem('loggedInUser')) || null;
}

// save a user to the session
function setLoggedInUser(user) {
    localStorage.setItem('loggedInUser', JSON.stringify(user));
}

// log out and redirect to login page
function logout() {
    localStorage.removeItem('loggedInUser');
    window.location.href = 'index.html';
}

// redirect to login if no session found
function requireAuth() {
    if (!getLoggedInUser()) {
        window.location.href = 'index.html';
    }
}


/* RUN ON EVERY PAGE LOAD */
initStorage();