// Authentication JavaScript

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
        const submitButton = loginForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Logging in...';
        submitButton.disabled = true;
        
        // Send login request to API
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        // Parse response
        const data = await response.json();
        
        // Reset button
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        
        // Handle response
        if (response.ok) {
            // Save token and user data to localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
        } else {
            // Show error message
            showError('login-error', data.error || 'Login failed. Please try again.');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('login-error', 'An error occurred. Please try again later.');
        
        // Reset button
        const submitButton = loginForm.querySelector('button[type="submit"]');
        submitButton.textContent = 'Login';
        submitButton.disabled = false;
    }
}

// Handle register form submission
async function handleRegister(e) {
    e.preventDefault();
    
    // Get form data
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const role = document.querySelector('input[name="role"]:checked').value;
    
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
        const submitButton = registerForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Registering...';
        submitButton.disabled = true;
        
        // Send register request to API
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password, role })
        });
        
        // Parse response
        const data = await response.json();
        
        // Reset button
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        
        // Handle response
        if (response.ok) {
            // Save token and user data to localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
        } else {
            // Show error message
            showError('register-error', data.error || 'Registration failed. Please try again.');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showError('register-error', 'An error occurred. Please try again later.');
        
        // Reset button
        const submitButton = registerForm.querySelector('button[type="submit"]');
        submitButton.textContent = 'Register';
        submitButton.disabled = false;
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
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        // User is already logged in, redirect to dashboard
        window.location.href = 'dashboard.html';
    }
}

// For demo purposes, add mock login functionality
// This will be removed when the backend is fully implemented
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Override fetch for login and register endpoints
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
        if (url === '/api/login' && options.method === 'POST') {
            return mockLogin(JSON.parse(options.body));
        } else if (url === '/api/register' && options.method === 'POST') {
            return mockRegister(JSON.parse(options.body));
        }
        
        return originalFetch(url, options);
    };
    
    // Mock login function
    async function mockLogin(credentials) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check credentials
        if (credentials.email === 'student@example.com' && credentials.password === 'password') {
            return {
                ok: true,
                json: () => Promise.resolve({
                    token: 'mock-token-student',
                    user: {
                        id: 1,
                        name: 'John Doe',
                        email: 'student@example.com',
                        role: 'student'
                    }
                })
            };
        } else if (credentials.email === 'tutor@example.com' && credentials.password === 'password') {
            return {
                ok: true,
                json: () => Promise.resolve({
                    token: 'mock-token-tutor',
                    user: {
                        id: 2,
                        name: 'Dr. Sarah Johnson',
                        email: 'tutor@example.com',
                        role: 'tutor'
                    }
                })
            };
        } else {
            return {
                ok: false,
                json: () => Promise.resolve({
                    error: 'Invalid email or password'
                })
            };
        }
    }
    
    // Mock register function
    async function mockRegister(userData) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if email is already taken
        if (userData.email === 'student@example.com' || userData.email === 'tutor@example.com') {
            return {
                ok: false,
                json: () => Promise.resolve({
                    error: 'Email is already taken'
                })
            };
        } else {
            return {
                ok: true,
                json: () => Promise.resolve({
                    token: 'mock-token-new-user',
                    user: {
                        id: 3,
                        name: userData.name,
                        email: userData.email,
                        role: userData.role
                    }
                })
            };
        }
    }
}
