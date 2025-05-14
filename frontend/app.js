/**
 * TutorConnect Main JavaScript
 * Handles common functionality across the platform
 * Optimized for performance with code splitting
 */

// Performance measurement
if (window.performance && window.performance.mark) {
    window.performance.mark('js_init_start');
}

// Use IIFE for better scoping and avoid global namespace pollution
(function() {
    'use strict';

    // Lazy load modules
    const modules = {
        // Store module loading promises
        _cache: {},

        // Load a module dynamically
        load: function(name) {
            if (!this._cache[name]) {
                this._cache[name] = new Promise((resolve) => {
                    // In a real app, this would use dynamic imports
                    // For this demo, we'll simulate module loading
                    setTimeout(() => {
                        console.log(`Module ${name} loaded`);
                        resolve(window.TutorConnect[name]);
                    }, 0);
                });
            }
            return this._cache[name];
        }
    };

    // Initialize global namespace
    window.TutorConnect = window.TutorConnect || {};

    // DOM Elements - use function to defer execution until needed
    const getElements = () => ({
        loginBtn: document.getElementById('login-btn'),
        signupBtn: document.getElementById('signup-btn')
    });

    // Event Listeners
    document.addEventListener('DOMContentLoaded', () => {
        console.log('TutorConnect App Initialized');

        if (window.performance && window.performance.mark) {
            window.performance.mark('dom_ready');
            window.performance.measure('js_to_dom_ready', 'js_init_start', 'dom_ready');
        }

        // Initialize core features immediately
        initMobileMenu();
        initAccessibility();

        // Initialize event listeners with performance optimization
        const elements = getElements();

        // Login button click event - lazy load the auth module
        if (elements.loginBtn) {
            elements.loginBtn.addEventListener('click', (e) => {
                e.preventDefault();

                // Show loading indicator
                const loadingIndicator = createLoadingIndicator();
                document.body.appendChild(loadingIndicator);

                // Load auth module and show login modal
                modules.load('auth').then(() => {
                    document.body.removeChild(loadingIndicator);
                    showLoginModal();
                });
            });
        }

        // Signup button click event - lazy load the auth module
        if (elements.signupBtn) {
            elements.signupBtn.addEventListener('click', (e) => {
                e.preventDefault();

                // Show loading indicator
                const loadingIndicator = createLoadingIndicator();
                document.body.appendChild(loadingIndicator);

                // Load auth module and show signup modal
                modules.load('auth').then(() => {
                    document.body.removeChild(loadingIndicator);
                    showSignupModal();
                });
            });
        }

        // Report performance metrics
        if (window.performance && window.performance.getEntriesByType) {
            setTimeout(() => {
                const perfEntries = window.performance.getEntriesByType('measure');
                console.log('Performance metrics:', perfEntries);
            }, 1000);
        }
    });

    // Create loading indicator
    function createLoadingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'loading-indicator';
        indicator.setAttribute('aria-label', 'Loading');
        indicator.setAttribute('role', 'status');
        indicator.innerHTML = '<div class="spinner"></div>';
        return indicator;
    }

/**
 * Initialize mobile menu functionality
 */
function initMobileMenu() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const mainMenu = document.getElementById('main-menu');

    if (!menuToggle) return;

    // Show the menu toggle button
    menuToggle.hidden = false;

    menuToggle.addEventListener('click', () => {
        const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
        menuToggle.setAttribute('aria-expanded', !isExpanded);

        // Close menu when clicking on a link
        const menuLinks = mainMenu.querySelectorAll('a');
        menuLinks.forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.setAttribute('aria-expanded', 'false');
            });
        });
    });

    // Close menu when pressing Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
            menuToggle.setAttribute('aria-expanded', 'false');
        }
    });
}

/**
 * Initialize accessibility features
 */
function initAccessibility() {
    // Add focus trap for modals
    const modals = document.querySelectorAll('.modal-container');
    modals.forEach(modal => {
        if (!modal) return;

        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // Trap focus inside modal
        modal.addEventListener('keydown', (e) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        });
    });

    // Improve keyboard navigation for interactive elements
    const interactiveElements = document.querySelectorAll('.feature-card, .step, .testimonial-card');
    interactiveElements.forEach(element => {
        element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                element.click();
            }
        });
    });
}

// Functions
function showLoginModal() {
    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal-container';
    modalContainer.setAttribute('role', 'dialog');
    modalContainer.setAttribute('aria-modal', 'true');
    modalContainer.setAttribute('aria-labelledby', 'login-modal-title');

    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';

    // Create modal header
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    modalHeader.innerHTML = `
        <h2 id="login-modal-title">Login</h2>
        <button class="close-btn" aria-label="Close login modal">&times;</button>
    `;

    // Create modal body
    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
    modalBody.innerHTML = `
        <form id="login-form">
            <div class="form-group">
                <label for="login-email">Email</label>
                <input type="email" id="login-email" name="email" required autocomplete="email">
            </div>
            <div class="form-group">
                <label for="login-password">Password</label>
                <input type="password" id="login-password" name="password" required autocomplete="current-password">
            </div>
            <div class="form-actions">
                <button type="submit" class="primary-btn">Login</button>
            </div>
            <div class="form-footer">
                <p>Don't have an account? <a href="#" id="switch-to-signup">Sign up</a></p>
            </div>
        </form>
    `;

    // Append header and body to modal content
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);

    // Append modal content to modal container
    modalContainer.appendChild(modalContent);

    // Append modal container to body
    document.body.appendChild(modalContainer);

    // Store the element that had focus before opening the modal
    const previouslyFocusedElement = document.activeElement;

    // Focus the first input field
    setTimeout(() => {
        const firstInput = modalContainer.querySelector('input');
        if (firstInput) firstInput.focus();
    }, 100);

    // Add event listeners
    const closeBtn = modalContainer.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
        closeModal();
    });

    // Close modal when clicking outside
    modalContainer.addEventListener('click', (e) => {
        if (e.target === modalContainer) {
            closeModal();
        }
    });

    // Close modal when pressing Escape
    document.addEventListener('keydown', handleEscapeKey);

    const switchToSignupLink = modalContainer.querySelector('#switch-to-signup');
    switchToSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal();
        showSignupModal();
    });

    const loginForm = modalContainer.querySelector('#login-form');
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = loginForm.email.value;
        const password = loginForm.password.value;

        // Here you would typically make an API call to authenticate the user
        console.log('Login attempt:', { email, password });

        // For demo purposes, simulate a successful login
        // Replace alert with a more accessible notification
        const successMessage = document.createElement('div');
        successMessage.className = 'notification success';
        successMessage.setAttribute('role', 'alert');
        successMessage.textContent = 'Login successful!';
        document.body.appendChild(successMessage);

        // Remove notification after 3 seconds
        setTimeout(() => {
            if (document.body.contains(successMessage)) {
                document.body.removeChild(successMessage);
            }
        }, 3000);

        closeModal();
    });

    // Function to close the modal
    function closeModal() {
        document.removeEventListener('keydown', handleEscapeKey);
        document.body.removeChild(modalContainer);

        // Return focus to the element that had it before the modal was opened
        if (previouslyFocusedElement) {
            previouslyFocusedElement.focus();
        }
    }

    // Function to handle Escape key
    function handleEscapeKey(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    }
}

function showSignupModal() {
    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal-container';
    modalContainer.setAttribute('role', 'dialog');
    modalContainer.setAttribute('aria-modal', 'true');
    modalContainer.setAttribute('aria-labelledby', 'signup-modal-title');

    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';

    // Create modal header
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    modalHeader.innerHTML = `
        <h2 id="signup-modal-title">Sign Up</h2>
        <button class="close-btn" aria-label="Close signup modal">&times;</button>
    `;

    // Create modal body
    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
    modalBody.innerHTML = `
        <form id="signup-form">
            <div class="form-group">
                <label for="signup-name">Full Name</label>
                <input type="text" id="signup-name" name="name" required autocomplete="name">
            </div>
            <div class="form-group">
                <label for="signup-email">Email</label>
                <input type="email" id="signup-email" name="email" required autocomplete="email">
            </div>
            <div class="form-group">
                <label for="signup-password">Password</label>
                <input type="password" id="signup-password" name="password" required autocomplete="new-password"
                       aria-describedby="password-requirements">
                <p id="password-requirements" class="form-hint">Password must be at least 8 characters long and include a mix of letters, numbers, and symbols.</p>
            </div>
            <div class="form-group">
                <label for="signup-confirm-password">Confirm Password</label>
                <input type="password" id="signup-confirm-password" name="confirmPassword" required autocomplete="new-password">
            </div>
            <div class="form-group">
                <fieldset>
                    <legend>Account Type</legend>
                    <div class="radio-group">
                        <label for="account-student">
                            <input type="radio" id="account-student" name="accountType" value="student" checked> Student
                        </label>
                        <label for="account-tutor">
                            <input type="radio" id="account-tutor" name="accountType" value="tutor"> Tutor
                        </label>
                    </div>
                </fieldset>
            </div>
            <div class="form-actions">
                <button type="submit" class="primary-btn">Sign Up</button>
            </div>
            <div class="form-footer">
                <p>Already have an account? <a href="#" id="switch-to-login">Login</a></p>
            </div>
        </form>
    `;

    // Append header and body to modal content
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);

    // Append modal content to modal container
    modalContainer.appendChild(modalContent);

    // Append modal container to body
    document.body.appendChild(modalContainer);

    // Store the element that had focus before opening the modal
    const previouslyFocusedElement = document.activeElement;

    // Focus the first input field
    setTimeout(() => {
        const firstInput = modalContainer.querySelector('input');
        if (firstInput) firstInput.focus();
    }, 100);

    // Add event listeners
    const closeBtn = modalContainer.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
        closeModal();
    });

    // Close modal when clicking outside
    modalContainer.addEventListener('click', (e) => {
        if (e.target === modalContainer) {
            closeModal();
        }
    });

    // Close modal when pressing Escape
    document.addEventListener('keydown', handleEscapeKey);

    const switchToLoginLink = modalContainer.querySelector('#switch-to-login');
    switchToLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal();
        showLoginModal();
    });

    const signupForm = modalContainer.querySelector('#signup-form');
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = signupForm.name.value;
        const email = signupForm.email.value;
        const password = signupForm.password.value;
        const confirmPassword = signupForm.confirmPassword.value;
        const accountType = signupForm.accountType.value;

        // Validate passwords match
        if (password !== confirmPassword) {
            // Create accessible error message
            const errorMessage = document.createElement('div');
            errorMessage.className = 'notification error';
            errorMessage.setAttribute('role', 'alert');
            errorMessage.textContent = 'Passwords do not match!';
            document.body.appendChild(errorMessage);

            // Remove notification after 3 seconds
            setTimeout(() => {
                if (document.body.contains(errorMessage)) {
                    document.body.removeChild(errorMessage);
                }
            }, 3000);

            // Focus the confirm password field
            const confirmPasswordField = signupForm.querySelector('#signup-confirm-password');
            if (confirmPasswordField) confirmPasswordField.focus();

            return;
        }

        // Here you would typically make an API call to register the user
        console.log('Signup attempt:', { name, email, password, accountType });

        // For demo purposes, simulate a successful registration
        // Replace alert with a more accessible notification
        const successMessage = document.createElement('div');
        successMessage.className = 'notification success';
        successMessage.setAttribute('role', 'alert');
        successMessage.textContent = 'Registration successful!';
        document.body.appendChild(successMessage);

        // Remove notification after 3 seconds
        setTimeout(() => {
            if (document.body.contains(successMessage)) {
                document.body.removeChild(successMessage);
            }
        }, 3000);

        closeModal();
    });

    // Function to close the modal
    function closeModal() {
        document.removeEventListener('keydown', handleEscapeKey);
        document.body.removeChild(modalContainer);

        // Return focus to the element that had it before the modal was opened
        if (previouslyFocusedElement) {
            previouslyFocusedElement.focus();
        }
    }

    // Function to handle Escape key
    function handleEscapeKey(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    }
}
