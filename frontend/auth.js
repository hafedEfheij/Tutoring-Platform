/**
 * TutorConnect Auth Module
 * Handles authentication functionality
 * Optimized for performance with code splitting
 */

// Performance measurement
if (window.performance && window.performance.mark) {
    window.performance.mark('auth_init_start');
}

// Initialize auth module in the global namespace
window.TutorConnect = window.TutorConnect || {};
window.TutorConnect.auth = {
    // Authentication state
    isAuthenticated: false,
    currentUser: null,

    // Initialize auth module
    init: function() {
        // Check if user is already authenticated
        const token = localStorage.getItem('token');
        if (token) {
            try {
                // In a real app, this would validate the token
                this.isAuthenticated = true;
                this.currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            } catch (error) {
                console.error('Error parsing user data:', error);
                this.logout();
            }
        }

        return this;
    },

    // Login user
    login: function(email, password) {
        return new Promise((resolve, reject) => {
            // In a real app, this would make an API call
            this._mockApiCall('/api/login', {
                method: 'POST',
                body: { email, password }
            }).then(data => {
                // Store user data
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                this.isAuthenticated = true;
                this.currentUser = data.user;

                resolve(data.user);
            }).catch(error => {
                reject(error);
            });
        });
    },

    // Register user
    register: function(userData) {
        return new Promise((resolve, reject) => {
            // In a real app, this would make an API call
            this._mockApiCall('/api/register', {
                method: 'POST',
                body: userData
            }).then(data => {
                // Store user data
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                this.isAuthenticated = true;
                this.currentUser = data.user;

                resolve(data.user);
            }).catch(error => {
                reject(error);
            });
        });
    },

    // Logout user
    logout: function() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        this.isAuthenticated = false;
        this.currentUser = null;

        return Promise.resolve();
    },

    // Helper method for API calls
    _mockApiCall: function(url, options) {
        return new Promise((resolve, reject) => {
            // Simulate network delay
            setTimeout(() => {
                if (url === '/api/login') {
                    this._handleMockLogin(options.body, resolve, reject);
                } else if (url === '/api/register') {
                    this._handleMockRegister(options.body, resolve, reject);
                } else {
                    reject(new Error('Unknown API endpoint'));
                }
            }, 500);
        });
    },

    // Handle mock login
    _handleMockLogin: function(credentials, resolve, reject) {
        if (credentials.email === 'student@example.com' && credentials.password === 'password') {
            resolve({
                token: 'mock-token-student',
                user: {
                    id: 1,
                    name: 'John Doe',
                    email: 'student@example.com',
                    role: 'student'
                }
            });
        } else if (credentials.email === 'tutor@example.com' && credentials.password === 'password') {
            resolve({
                token: 'mock-token-tutor',
                user: {
                    id: 2,
                    name: 'Dr. Sarah Johnson',
                    email: 'tutor@example.com',
                    role: 'tutor'
                }
            });
        } else {
            reject(new Error('Invalid email or password'));
        }
    },

    // Handle mock register
    _handleMockRegister: function(userData, resolve, reject) {
        if (userData.email === 'student@example.com' || userData.email === 'tutor@example.com') {
            reject(new Error('Email is already taken'));
        } else {
            resolve({
                token: 'mock-token-new-user',
                user: {
                    id: 3,
                    name: userData.name,
                    email: userData.email,
                    role: userData.role
                }
            });
        }
    }
};

// Initialize auth module
window.TutorConnect.auth.init();

// Mark performance end
if (window.performance && window.performance.mark) {
    window.performance.mark('auth_init_end');
    window.performance.measure('auth_init', 'auth_init_start', 'auth_init_end');
}

// For the auth page itself
document.addEventListener('DOMContentLoaded', () => {
    console.log('Auth Page Initialized');

    // Initialize tabs
    initTabs();

    // Initialize forms
    initForms();

    // Check if user is already logged in
    checkAuthStatus();
});

// Initialize tabs
function initTabs() {
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and forms
            tabs.forEach(t => t.classList.remove('active'));
            forms.forEach(f => f.classList.remove('active'));

            // Add active class to clicked tab
            tab.classList.add('active');

            // Show corresponding form
            const formId = `${tab.dataset.tab}-form`;
            document.getElementById(formId).classList.add('active');
        });
    });
}

// Initialize forms
function initForms() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
}

// Handle login form submission
async function handleLogin(e) {
    e.preventDefault();

    // Performance tracking
    if (window.performance && window.performance.mark) {
        window.performance.mark('login_start');
    }

    // Get form data
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    // Validate input
    if (!email || !password) {
        showError('login-error', 'Please enter both email and password');
        return;
    }

    try {
        // Show loading state
        const submitButton = document.querySelector('#login-form button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Logging in...';
        submitButton.disabled = true;

        // Use the auth module for login
        await window.TutorConnect.auth.login(email, password);

        // Performance tracking
        if (window.performance && window.performance.mark) {
            window.performance.mark('login_success');
            window.performance.measure('login_time', 'login_start', 'login_success');
        }

        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error('Login error:', error);
        showError('login-error', error.message || 'An error occurred. Please try again later.');

        // Reset button
        const submitButton = document.querySelector('#login-form button[type="submit"]');
        submitButton.textContent = originalText;
        submitButton.disabled = false;

        // Performance tracking
        if (window.performance && window.performance.mark) {
            window.performance.mark('login_error');
            window.performance.measure('login_error_time', 'login_start', 'login_error');
        }
    }
}

// Handle register form submission
async function handleRegister(e) {
    e.preventDefault();

    // Performance tracking
    if (window.performance && window.performance.mark) {
        window.performance.mark('register_start');
    }

    // Get form data
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const role = document.querySelector('input[name="role"]:checked')?.value || 'student';

    // Validate input
    if (!name || !email || !password || !confirmPassword) {
        showError('register-error', 'Please fill in all fields');
        return;
    }

    if (password !== confirmPassword) {
        showError('register-error', 'Passwords do not match');
        return;
    }

    if (password.length < 6) {
        showError('register-error', 'Password must be at least 6 characters long');
        return;
    }

    try {
        // Show loading state
        const submitButton = document.querySelector('#register-form button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Registering...';
        submitButton.disabled = true;

        // Use the auth module for registration
        await window.TutorConnect.auth.register({ name, email, password, role });

        // Performance tracking
        if (window.performance && window.performance.mark) {
            window.performance.mark('register_success');
            window.performance.measure('register_time', 'register_start', 'register_success');
        }

        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error('Registration error:', error);
        showError('register-error', error.message || 'An error occurred. Please try again later.');

        // Reset button
        const submitButton = document.querySelector('#register-form button[type="submit"]');
        submitButton.textContent = originalText;
        submitButton.disabled = false;

        // Performance tracking
        if (window.performance && window.performance.mark) {
            window.performance.mark('register_error');
            window.performance.measure('register_error_time', 'register_start', 'register_error');
        }
    }
}

// Show error message
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.style.display = 'block';

    // Hide error after 5 seconds
    setTimeout(() => {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }, 5000);
}

// Check if user is already logged in
function checkAuthStatus() {
    // Use the auth module to check authentication status
    if (window.TutorConnect.auth.isAuthenticated) {
        // User is already logged in, redirect to dashboard
        window.location.href = 'dashboard.html';
    }

    // Performance tracking
    if (window.performance && window.performance.mark) {
        window.performance.mark('auth_check_complete');
        window.performance.measure('auth_check_time', 'auth_init_start', 'auth_check_complete');
    }
}
