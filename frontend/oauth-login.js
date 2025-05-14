/**
 * OAuth Login Component for TutorConnect
 * Provides Google and Facebook login buttons
 */

// Initialize global namespace
window.TutorConnect = window.TutorConnect || {};

// OAuth Login Component
window.TutorConnect.oauthLogin = {
    // Initialize OAuth login buttons
    init: function() {
        // Create container for OAuth buttons
        const container = document.createElement('div');
        container.className = 'oauth-container';

        // Add heading
        const heading = document.createElement('div');
        heading.className = 'oauth-heading';
        heading.innerHTML = '<span>Or sign in with</span>';
        container.appendChild(heading);

        // Add buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'oauth-buttons';

        // Add Google button
        const googleButton = document.createElement('a');
        googleButton.href = 'http://localhost:3000/auth/google';
        googleButton.className = 'oauth-button google-button';
        googleButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Google</span>
        `;
        buttonsContainer.appendChild(googleButton);

        // Add Facebook button
        const facebookButton = document.createElement('a');
        facebookButton.href = 'http://localhost:3000/auth/facebook';
        facebookButton.className = 'oauth-button facebook-button';
        facebookButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span>Facebook</span>
        `;
        buttonsContainer.appendChild(facebookButton);

        container.appendChild(buttonsContainer);

        return container;
    },

    // Handle OAuth success callback
    handleCallback: function() {
        // Check if we have a token in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        if (token) {
            // Store token in sessionStorage
            sessionStorage.setItem('token', token);

            // Redirect to dashboard
            window.location.href = '/dashboard.html';
        }
    }
};

// Add styles for OAuth buttons
const style = document.createElement('style');
style.textContent = `
    .oauth-container {
        margin-top: 2rem;
        width: 100%;
    }

    .oauth-heading {
        position: relative;
        text-align: center;
        margin-bottom: 1rem;
    }

    .oauth-heading span {
        display: inline-block;
        padding: 0 1rem;
        background-color: white;
        position: relative;
        z-index: 1;
        color: var(--text-light);
        font-size: 0.875rem;
    }

    .oauth-heading::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 1px;
        background-color: var(--border-color);
        z-index: 0;
    }

    .oauth-buttons {
        display: flex;
        gap: 1rem;
        justify-content: center;
    }

    .oauth-button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        border-radius: 0.375rem;
        border: 1px solid var(--border-color);
        background-color: white;
        color: var(--text-color);
        font-weight: 500;
        text-decoration: none;
        transition: background-color 0.2s, border-color 0.2s;
    }

    .oauth-button:hover {
        background-color: var(--secondary-color);
    }

    .oauth-button svg {
        width: 1.25rem;
        height: 1.25rem;
    }

    .google-button:hover {
        border-color: #4285F4;
    }

    .facebook-button:hover {
        border-color: #1877F2;
    }

    @media (prefers-color-scheme: dark) {
        .oauth-heading span {
            background-color: var(--secondary-color);
        }

        .oauth-button {
            background-color: var(--secondary-color);
            color: var(--text-color);
        }

        .oauth-button:hover {
            background-color: #2d3748;
        }
    }
`;

document.head.appendChild(style);

// Check if we're on the OAuth callback page
if (window.location.pathname === '/oauth-success.html' || window.location.pathname.includes('oauth-success')) {
    window.TutorConnect.oauthLogin.handleCallback();
}
