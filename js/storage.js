//  DEFAULT DATA 
const defaultData = {
  users: [],
  posts: []
}

//  INITIALIZE 
function initStorage() {
  if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify([]))
  }
  if (!localStorage.getItem('posts')) {
    localStorage.setItem('posts', JSON.stringify([]))
  }
}

//  USER HELPERS 
function getUsers() {
  return JSON.parse(localStorage.getItem('users')) || []
}

function saveUsers(users) {
  localStorage.setItem('users', JSON.stringify(users))
}

function getUserById(id) {
  return getUsers().find(u => u.id === id)
}

//  POST HELPERS 
function getPosts() {
  return JSON.parse(localStorage.getItem('posts')) || []
}

function savePosts(posts) {
  localStorage.setItem('posts', JSON.stringify(posts))
}

//  SESSION 
function getLoggedInUser() {
  return JSON.parse(localStorage.getItem('loggedInUser')) || null
}

function setLoggedInUser(user) {
  localStorage.setItem('loggedInUser', JSON.stringify(user))
}

function logout() {
  localStorage.removeItem('loggedInUser')
}