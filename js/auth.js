

/*  HELPERS  */

/* return true if the email address has a valid format */
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* return a score 0–4 based on how strong a password is */
function checkStrength(val) {
    var score = 0;
    if (val.length >= 6)               score++;
    if (val.length >= 10)              score++;
    if (/[A-Z]/.test(val) || /[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val))     score++;
    return score;
}

/* show an alert box with a message */
function showAlert(id, msg) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
}

/* hide an alert box */
function hideAlert(id) {
    var el = document.getElementById(id);
    if (el) el.classList.remove('show');
}

/* mark an input field as invalid */
function markInvalid(id) {
    var el = document.getElementById(id);
    if (el) el.classList.add('invalid');
}

/* strip invalid/valid styles from one or more input ids */
function clearValidation() {
    var ids = Array.prototype.slice.call(arguments);
    ids.forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.classList.remove('invalid', 'valid');
    });
}


/* LOGIN */

var loginForm = document.getElementById('login-form');

if (loginForm) {

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        /* clear previous errors */
        hideAlert('login-error');
        clearValidation('login-email', 'login-password');

        var email    = document.getElementById('login-email').value.trim().toLowerCase();
        var password = document.getElementById('login-password').value;

        /* check fields are not empty */
        if (!email) {
            markInvalid('login-email');
            showAlert('login-error', 'Please enter your email address.');
            return;
        }

        if (!password) {
            markInvalid('login-password');
            showAlert('login-error', 'Please enter your password.');
            return;
        }

        /* check credentials against stored users */
        var users = Storage.getUsers();
        var user = users.find(function(u) {
    return String(u.email || '').trim().toLowerCase() === email &&
           String(u.password || '') === password;
});

        if (!user) {
            markInvalid('login-email');
            markInvalid('login-password');
            showAlert('login-error', 'Incorrect email or password. Please try again.');
            return;
        }

        /* success — save session id and go to feed */
        Storage.setCurrentUser(user.id);
        window.location.href = 'feed.html';
    });

}


/* REGISTER */

var registerForm = document.getElementById('register-form');

if (registerForm) {

    /* strength bar elements */
    var passwordInput  = document.getElementById('reg-password');
    var strengthColors = ['#E24B4A', '#EF9F27', '#7F77DD', '#1D9E75'];
    var strengthLabels = ['Too short', 'Weak', 'Good', 'Strong'];
    var segments       = ['s1', 's2', 's3', 's4'].map(function(id) {
        return document.getElementById(id);
    });
    var strengthLabel  = document.getElementById('strength-label');

    /* update the strength bar as the user types */
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            var score = this.value ? checkStrength(this.value) : 0;

            segments.forEach(function(seg, i) {
                if (seg) {
                    seg.style.backgroundColor = i < score
                        ? strengthColors[score - 1]
                        : '#E8E6DF';
                }
            });

            if (strengthLabel) {
    if (!passwordInput.value) {
        strengthLabel.textContent = 'Min. 6 characters';
    } else if (score === 0) {
        strengthLabel.textContent = 'Too short';
    } else {
        strengthLabel.textContent = strengthLabels[score - 1];
    }
}
        });
    } 

    /* handle form submission */
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();

        /* clear previous alerts */
        hideAlert('reg-error');
        hideAlert('reg-success');
        clearValidation('reg-username', 'reg-email', 'reg-password', 'reg-confirm');

        var username = document.getElementById('reg-username').value.trim();
        var email    = document.getElementById('reg-email').value.trim().toLowerCase();
        var password = document.getElementById('reg-password').value;
        var confirm  = document.getElementById('reg-confirm').value;

        /* validate username */
        if (!username || username.length < 3) {
            markInvalid('reg-username');
            showAlert('reg-error', 'Username must be at least 3 characters.');
            return;
        }

        /* validate email format */
        if (!validateEmail(email)) {
            markInvalid('reg-email');
            showAlert('reg-error', 'Please enter a valid email address.');
            return;
        }

        /* validate password length */
        if (password.length < 6) {
            markInvalid('reg-password');
            showAlert('reg-error', 'Password must be at least 6 characters.');
            return;
        }

        /* validate passwords match */
        if (password !== confirm) {
            markInvalid('reg-confirm');
            showAlert('reg-error', 'Passwords do not match.');
            return;
        }

        var users = Storage.getUsers();

        /* check for duplicate email */
        if (users.find(function(u) { return u.email === email; })) {
            markInvalid('reg-email');
            showAlert('reg-error', 'An account with this email already exists.');
            return;
        }

        /* check for duplicate username */
        if (users.find(function(u) {
            return u.username.toLowerCase() === username.toLowerCase();
        })) {
            markInvalid('reg-username');
            showAlert('reg-error', 'That username is already taken.');
            return;
        }

        /* build the new user object */
        var newUser = {
            id:             generateId(),
            username:       username,
            email:          email,
            password:       password,
            bio:            '',
            profilePicture: '',
            following:      [],
            createdAt:      new Date().toISOString()
        };

        /* save to localStorage and show success */
                users.push(newUser);
        Storage.setUsers(users);
        Storage.setCurrentUser(newUser.id);

        showAlert('reg-success', 'Account created! Redirecting to your feed...');
        registerForm.reset();

        segments.forEach(function(seg) {
            if (seg) seg.style.backgroundColor = '#E8E6DF';
        });

        if (strengthLabel) strengthLabel.textContent = 'Min. 6 characters';

        setTimeout(function() {
            window.location.href = 'feed.html';
        }, 1200);
    });

}