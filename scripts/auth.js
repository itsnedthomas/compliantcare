/**
 * CompliantCare CRM - Authentication Handler
 * Supabase Auth integration for email/password authentication
 */

var SUPABASE_URL = 'https://qdrbwvxqtgwjgitcambn.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcmJ3dnhxdGd3amdpdGNhbWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4OTE4NDMsImV4cCI6MjA4NTQ2Nzg0M30.8oJPT8Nyr4FbS2SZp9j9VEsnk5oAumV2_kWNam-RZD4';

var AuthHandler = {
    currentUser: null,
    isSignUpMode: false,

    init: async function () {
        console.log('AuthHandler initializing...');

        // Setup form handlers
        this.setupFormHandlers();

        // Check for existing session
        var session = await this.getSession();

        if (session && session.user) {
            this.currentUser = session.user;
            this.showApp();
            return true;
        } else {
            this.showLogin();
            return false;
        }
    },

    setupFormHandlers: function () {
        var self = this;
        var form = document.getElementById('login-form');
        var signupBtn = document.getElementById('signup-btn');
        var loginBtn = document.getElementById('login-btn');

        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                if (self.isSignUpMode) {
                    self.handleSignUp();
                } else {
                    self.handleSignIn();
                }
            });
        }

        if (signupBtn) {
            signupBtn.addEventListener('click', function () {
                self.toggleMode();
            });
        }
    },

    toggleMode: function () {
        this.isSignUpMode = !this.isSignUpMode;
        var loginBtn = document.getElementById('login-btn');
        var signupBtn = document.getElementById('signup-btn');

        if (this.isSignUpMode) {
            loginBtn.textContent = 'Create Account';
            signupBtn.textContent = 'Back to Sign In';
        } else {
            loginBtn.textContent = 'Sign In';
            signupBtn.textContent = 'Create Account';
        }

        this.clearError();
    },

    handleSignIn: async function () {
        var email = document.getElementById('auth-email').value;
        var password = document.getElementById('auth-password').value;

        if (!email || !password) {
            this.showError('Please enter email and password');
            return;
        }

        this.setLoading(true);
        this.clearError();

        try {
            var result = await this.signIn(email, password);

            if (result.error) {
                this.showError(result.error.message || 'Sign in failed');
            } else {
                this.currentUser = result.data.user;
                this.showApp();
            }
        } catch (error) {
            this.showError(error.message || 'An error occurred');
        } finally {
            this.setLoading(false);
        }
    },

    handleSignUp: async function () {
        var email = document.getElementById('auth-email').value;
        var password = document.getElementById('auth-password').value;

        if (!email || !password) {
            this.showError('Please enter email and password');
            return;
        }

        if (password.length < 6) {
            this.showError('Password must be at least 6 characters');
            return;
        }

        this.setLoading(true);
        this.clearError();

        try {
            var result = await this.signUp(email, password);

            if (result.error) {
                this.showError(result.error.message || 'Sign up failed');
            } else {
                // Check if email confirmation is required
                if (result.data.user && !result.data.session) {
                    this.showError('Check your email to confirm your account!');
                    this.isSignUpMode = false;
                    this.toggleMode();
                } else {
                    this.currentUser = result.data.user;
                    this.showApp();
                }
            }
        } catch (error) {
            this.showError(error.message || 'An error occurred');
        } finally {
            this.setLoading(false);
        }
    },

    signIn: async function (email, password) {
        var response = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        var data = await response.json();

        if (!response.ok) {
            return { error: { message: data.error_description || data.msg || 'Invalid login credentials' }, data: null };
        }

        // Store session
        localStorage.setItem('supabase_access_token', data.access_token);
        localStorage.setItem('supabase_refresh_token', data.refresh_token);

        return { error: null, data: { user: data.user, session: data } };
    },

    signUp: async function (email, password) {
        var response = await fetch(SUPABASE_URL + '/auth/v1/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        var data = await response.json();

        if (!response.ok) {
            return { error: { message: data.error_description || data.msg || 'Sign up failed' }, data: null };
        }

        // Store session if auto-confirmed
        if (data.access_token) {
            localStorage.setItem('supabase_access_token', data.access_token);
            localStorage.setItem('supabase_refresh_token', data.refresh_token);
        }

        return { error: null, data: { user: data.user || data, session: data.access_token ? data : null } };
    },

    signOut: async function () {
        var accessToken = localStorage.getItem('supabase_access_token');

        if (accessToken) {
            try {
                await fetch(SUPABASE_URL + '/auth/v1/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': 'Bearer ' + accessToken
                    }
                });
            } catch (e) {
                console.log('Logout request failed, clearing local session anyway');
            }
        }

        // Clear local storage
        localStorage.removeItem('supabase_access_token');
        localStorage.removeItem('supabase_refresh_token');
        this.currentUser = null;

        // Show login page
        this.showLogin();
    },

    getSession: async function () {
        var accessToken = localStorage.getItem('supabase_access_token');

        if (!accessToken) {
            return null;
        }

        // Verify token is still valid by fetching user
        try {
            var response = await fetch(SUPABASE_URL + '/auth/v1/user', {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': 'Bearer ' + accessToken
                }
            });

            if (!response.ok) {
                // Token expired or invalid
                localStorage.removeItem('supabase_access_token');
                localStorage.removeItem('supabase_refresh_token');
                return null;
            }

            var user = await response.json();
            return { user: user };
        } catch (error) {
            console.error('Session check failed:', error);
            return null;
        }
    },

    showLogin: function () {
        var loginPage = document.getElementById('login-page');
        var app = document.querySelector('.app');
        var userSection = document.getElementById('user-section');

        if (loginPage) loginPage.style.display = 'flex';
        if (app) app.style.display = 'none';
        if (userSection) userSection.style.display = 'none';
    },

    showApp: function () {
        var loginPage = document.getElementById('login-page');
        var app = document.querySelector('.app');
        var userSection = document.getElementById('user-section');
        var userEmail = document.getElementById('user-email');
        var userAvatar = document.getElementById('user-avatar');

        if (loginPage) loginPage.style.display = 'none';
        if (app) app.style.display = 'flex';
        if (userSection) userSection.style.display = 'flex';

        // Update user display
        if (this.currentUser && userEmail) {
            userEmail.textContent = 'CompliantCare';
        }
        if (this.currentUser && userAvatar) {
            userAvatar.textContent = this.currentUser.email ? this.currentUser.email[0].toUpperCase() : 'U';
        }

        // Initialize the main app
        if (typeof CRMApp !== 'undefined' && !CRMApp.initialized) {
            CRMApp.init();
            CRMApp.initialized = true;
        }
    },

    showError: function (message) {
        var errorEl = document.getElementById('auth-error');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }
    },

    clearError: function () {
        var errorEl = document.getElementById('auth-error');
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.style.display = 'none';
        }
    },

    setLoading: function (loading) {
        var loginBtn = document.getElementById('login-btn');
        var signupBtn = document.getElementById('signup-btn');

        if (loginBtn) {
            loginBtn.disabled = loading;
            if (loading) {
                loginBtn.textContent = 'Please wait...';
            } else {
                loginBtn.textContent = this.isSignUpMode ? 'Create Account' : 'Sign In';
            }
        }
        if (signupBtn) {
            signupBtn.disabled = loading;
        }
    }
};

window.AuthHandler = AuthHandler;

// Initialize auth when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    AuthHandler.init();
});

console.log('AuthHandler loaded');
