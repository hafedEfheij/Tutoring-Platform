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
        try {
            // Check if user data exists in sessionStorage (more secure than localStorage)
            const userData = sessionStorage.getItem('user');
            if (userData) {
                const user = JSON.parse(userData);

                // Set authentication state
                this.isAuthenticated = true;
                this.currentUser = user;

                // Verify token validity by making a refresh token request
                this.refreshToken()
                    .then(() => {
                        console.log('Token refreshed successfully during initialization');
                    })
                    .catch(error => {
                        console.warn('Token refresh failed during initialization:', error);
                        // If refresh fails, user will need to login again
                        // State is already cleared by refreshToken method
                    });
            }
        } catch (error) {
            console.error('Error initializing auth module:', error);
            // Clear any potentially corrupted data
            this.logout();
        }

        // Set up security event listeners
        this._setupSecurityEventListeners();

        return this;
    },

    // Set up security event listeners
    _setupSecurityEventListeners: function() {
        // Note: sessionStorage doesn't trigger storage events in other tabs
        // But we'll keep this for compatibility with any localStorage usage
        window.addEventListener('storage', (event) => {
            if (event.key === 'user' && event.newValue !== event.oldValue) {
                if (!event.newValue) {
                    // User was logged out in another tab
                    this.isAuthenticated = false;
                    this.currentUser = null;

                    // Redirect to login page if not already there
                    if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('index.html')) {
                        window.location.href = 'index.html';
                    }
                } else {
                    // User data was updated in another tab
                    try {
                        this.currentUser = JSON.parse(event.newValue);
                        this.isAuthenticated = true;
                    } catch (error) {
                        console.error('Error parsing user data from storage event:', error);
                    }
                }
            }
        });

        // Listen for visibility changes to refresh token when tab becomes visible again
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && this.isAuthenticated) {
                this.refreshToken()
                    .catch(error => console.warn('Token refresh failed on visibility change:', error));
            }
        });

        // Add security check for session timeout
        const sessionCheckInterval = setInterval(() => {
            if (this.isAuthenticated) {
                // Check if session is still valid
                this.refreshToken()
                    .catch(error => {
                        console.warn('Session expired:', error);
                        clearInterval(sessionCheckInterval);
                    });
            } else {
                clearInterval(sessionCheckInterval);
            }
        }, 5 * 60 * 1000); // Check every 5 minutes
    },

    // Login user
    login: function(email, password) {
        return new Promise((resolve, reject) => {
            // Make API call to login endpoint
            this._mockApiCall('/api/login', {
                method: 'POST',
                body: { email, password }
            }).then(data => {
                // Store user data and CSRF token in sessionStorage (more secure than localStorage)
                sessionStorage.setItem('user', JSON.stringify(data.user));
                if (data.csrfToken) {
                    this.csrfToken = data.csrfToken;
                    // Store CSRF token in a secure way
                    sessionStorage.setItem('csrfToken', data.csrfToken);
                }

                this.isAuthenticated = true;
                this.currentUser = data.user;

                // Start token refresh timer
                this._startTokenRefreshTimer();

                // Log login for security auditing
                console.info('User logged in:', data.user.email);

                resolve(data.user);
            }).catch(error => {
                // Log failed login attempts for security monitoring
                console.warn('Login failed:', email);
                reject(error);
            });
        });
    },

    // Register user
    register: function(userData) {
        return new Promise((resolve, reject) => {
            // Make API call to register endpoint
            this._mockApiCall('/api/register', {
                method: 'POST',
                body: userData
            }).then(data => {
                // Store user data and CSRF token in sessionStorage
                sessionStorage.setItem('user', JSON.stringify(data.user));
                if (data.csrfToken) {
                    this.csrfToken = data.csrfToken;
                    // Store CSRF token in a secure way
                    sessionStorage.setItem('csrfToken', data.csrfToken);
                }

                this.isAuthenticated = true;
                this.currentUser = data.user;

                // Start token refresh timer
                this._startTokenRefreshTimer();

                // Log registration for security auditing
                console.info('User registered:', data.user.email);

                resolve(data.user);
            }).catch(error => {
                console.warn('Registration failed:', userData.email);
                reject(error);
            });
        });
    },

    // Logout user
    logout: function() {
        return new Promise((resolve, reject) => {
            // Make API call to logout endpoint
            this._mockApiCall('/api/logout', {
                method: 'POST'
            }).then(() => {
                // Clear session storage
                sessionStorage.removeItem('user');
                sessionStorage.removeItem('csrfToken');

                // Clear auth state
                this.isAuthenticated = false;
                this.currentUser = null;
                this.csrfToken = null;

                // Clear token refresh timer
                if (this._tokenRefreshTimer) {
                    clearTimeout(this._tokenRefreshTimer);
                    this._tokenRefreshTimer = null;
                }

                // Log logout for security auditing
                console.info('User logged out');

                resolve();
            }).catch(error => {
                console.error('Logout error:', error);

                // Even if the API call fails, clear session state
                sessionStorage.removeItem('user');
                sessionStorage.removeItem('csrfToken');
                this.isAuthenticated = false;
                this.currentUser = null;
                this.csrfToken = null;

                if (this._tokenRefreshTimer) {
                    clearTimeout(this._tokenRefreshTimer);
                    this._tokenRefreshTimer = null;
                }

                resolve();
            });
        });
    },

    // Refresh access token
    refreshToken: function() {
        return new Promise((resolve, reject) => {
            this._mockApiCall('/api/refresh-token', {
                method: 'POST'
            }).then(data => {
                if (data.csrfToken) {
                    this.csrfToken = data.csrfToken;
                    sessionStorage.setItem('csrfToken', data.csrfToken);
                }
                resolve();
            }).catch(error => {
                console.error('Token refresh error:', error);

                // If refresh fails, user needs to login again
                this.isAuthenticated = false;
                this.currentUser = null;
                sessionStorage.removeItem('user');
                sessionStorage.removeItem('csrfToken');

                // Redirect to login page if not already there
                if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('index.html')) {
                    window.location.href = 'index.html?session_expired=true';
                }

                reject(error);
            });
        });
    },

    // Start token refresh timer
    _startTokenRefreshTimer: function() {
        // Clear existing timer if any
        if (this._tokenRefreshTimer) {
            clearTimeout(this._tokenRefreshTimer);
        }

        // Set timer to refresh token before it expires (e.g., every 14 minutes for a 15-minute token)
        this._tokenRefreshTimer = setTimeout(() => {
            this.refreshToken()
                .then(() => {
                    // Restart timer after successful refresh
                    this._startTokenRefreshTimer();
                })
                .catch(error => {
                    console.error('Failed to refresh token:', error);
                    // Don't restart timer on failure
                });
        }, 14 * 60 * 1000); // 14 minutes
    },

    // Helper method for API calls
    _mockApiCall: function(url, options) {
        // In a real app, this would be a real API call
        // For now, we'll use a mix of real and mock calls

        // Check if we're in a development environment with a real backend
        const useRealBackend = window.location.hostname === 'localhost' ||
                              window.location.hostname === '127.0.0.1';

        if (useRealBackend) {
            // Try to use the real backend
            return this._realApiCall(url, options).catch(error => {
                console.warn('Real API call failed, falling back to mock:', error);
                return this._mockApiCallImplementation(url, options);
            });
        } else {
            // Use mock implementation
            return this._mockApiCallImplementation(url, options);
        }
    },

    // Real API call implementation
    _realApiCall: function(url, options) {
        // Get CSRF token if needed
        return this._ensureCsrfToken().then(csrfToken => {
            // Prepare headers
            const headers = {
                'Content-Type': 'application/json',
                ...options.headers
            };

            // Add CSRF token for non-GET requests
            if (options.method !== 'GET' && csrfToken) {
                headers['X-CSRF-Token'] = csrfToken;
            }

            // Make the actual fetch request
            return fetch(url, {
                method: options.method || 'GET',
                headers,
                body: options.body ? JSON.stringify(options.body) : undefined,
                credentials: 'include' // Include cookies
            }).then(response => {
                if (!response.ok) {
                    return response.json().then(data => {
                        throw new Error(data.error || 'API request failed');
                    });
                }
                return response.json();
            });
        });
    },

    // Ensure we have a CSRF token
    _ensureCsrfToken: function() {
        // First check if we have a token in memory
        if (this.csrfToken) {
            return Promise.resolve(this.csrfToken);
        }

        // Then check if we have a token in sessionStorage
        const storedToken = sessionStorage.getItem('csrfToken');
        if (storedToken) {
            this.csrfToken = storedToken;
            return Promise.resolve(storedToken);
        }

        // Otherwise, fetch a new token
        return fetch('/api/csrf-token', {
            credentials: 'include' // Include cookies
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to get CSRF token');
            }
            return response.json();
        })
        .then(data => {
            this.csrfToken = data.csrfToken;
            // Store in sessionStorage for persistence
            sessionStorage.setItem('csrfToken', data.csrfToken);
            return this.csrfToken;
        })
        .catch(error => {
            console.error('Error getting CSRF token:', error);

            // If we can't get a token and we're authenticated, this might indicate a session issue
            if (this.isAuthenticated) {
                console.warn('Authentication issue detected, refreshing token...');
                this.refreshToken().catch(() => {
                    // If refresh fails, clear authentication state
                    this.isAuthenticated = false;
                    this.currentUser = null;
                    sessionStorage.removeItem('user');
                    sessionStorage.removeItem('csrfToken');
                });
            }

            return null; // Return null if we can't get a token
        });
    },

    // Mock API call implementation (fallback)
    _mockApiCallImplementation: function(url, options) {
        return new Promise((resolve, reject) => {
            // Simulate network delay
            setTimeout(() => {
                if (url === '/api/login') {
                    this._handleMockLogin(options.body, resolve, reject);
                } else if (url === '/api/register') {
                    this._handleMockRegister(options.body, resolve, reject);
                } else if (url === '/api/refresh-token') {
                    this._handleMockRefreshToken(resolve, reject);
                } else if (url === '/api/logout') {
                    this._handleMockLogout(resolve, reject);
                } else {
                    reject(new Error('Unknown API endpoint'));
                }
            }, 500);
        });
    },

    // Handle mock login
    _handleMockLogin: function(credentials, resolve, reject) {
        if (credentials.email === 'student@example.com' && credentials.password === 'Password123!') {
            resolve({
                user: {
                    id: 1,
                    name: 'John Doe',
                    email: 'student@example.com',
                    role: 'student'
                },
                csrfToken: 'mock-csrf-token'
            });
        } else if (credentials.email === 'tutor@example.com' && credentials.password === 'Password123!') {
            resolve({
                user: {
                    id: 2,
                    name: 'Dr. Sarah Johnson',
                    email: 'tutor@example.com',
                    role: 'tutor'
                },
                csrfToken: 'mock-csrf-token'
            });
        } else {
            reject(new Error('Invalid email or password'));
        }
    },

    // Handle mock register
    _handleMockRegister: function(userData, resolve, reject) {
        // Validate password strength
        if (userData.password.length < 8) {
            reject(new Error('Password must be at least 8 characters long'));
            return;
        }

        // Check for common password patterns
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(userData.password)) {
            reject(new Error('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'));
            return;
        }

        if (userData.email === 'student@example.com' || userData.email === 'tutor@example.com') {
            reject(new Error('Email is already taken'));
        } else {
            resolve({
                user: {
                    id: 3,
                    name: userData.name,
                    email: userData.email,
                    role: userData.role
                },
                csrfToken: 'mock-csrf-token'
            });
        }
    },

    // Handle mock refresh token
    _handleMockRefreshToken: function(resolve, reject) {
        if (this.isAuthenticated) {
            resolve({ success: true });
        } else {
            reject(new Error('Invalid refresh token'));
        }
    },

    // Handle mock logout
    _handleMockLogout: function(resolve, reject) {
        resolve({ success: true });
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
    } else {
        // Check URL parameters for session expired message
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('session_expired')) {
            // Show session expired message
            showError('login-error', 'Your session has expired. Please log in again.');
        }
    }

    // Performance tracking
    if (window.performance && window.performance.mark) {
        window.performance.mark('auth_check_complete');
        window.performance.measure('auth_check_time', 'auth_init_start', 'auth_check_complete');
    }
}
