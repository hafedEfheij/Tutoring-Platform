// DOM Elements
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('TutorConnect App Initialized');
    
    // Login button click event
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            showLoginModal();
        });
    }
    
    // Signup button click event
    if (signupBtn) {
        signupBtn.addEventListener('click', () => {
            showSignupModal();
        });
    }
});

// Functions
function showLoginModal() {
    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal-container';
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    // Create modal header
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    modalHeader.innerHTML = `
        <h2>Login</h2>
        <button class="close-btn">&times;</button>
    `;
    
    // Create modal body
    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
    modalBody.innerHTML = `
        <form id="login-form">
            <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" required>
            </div>
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required>
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
    
    // Add event listeners
    const closeBtn = modalContainer.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(modalContainer);
    });
    
    const switchToSignupLink = modalContainer.querySelector('#switch-to-signup');
    switchToSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        document.body.removeChild(modalContainer);
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
        alert('Login successful!');
        document.body.removeChild(modalContainer);
    });
}

function showSignupModal() {
    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal-container';
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    // Create modal header
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    modalHeader.innerHTML = `
        <h2>Sign Up</h2>
        <button class="close-btn">&times;</button>
    `;
    
    // Create modal body
    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
    modalBody.innerHTML = `
        <form id="signup-form">
            <div class="form-group">
                <label for="name">Full Name</label>
                <input type="text" id="name" name="name" required>
            </div>
            <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" required>
            </div>
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required>
            </div>
            <div class="form-group">
                <label for="confirm-password">Confirm Password</label>
                <input type="password" id="confirm-password" name="confirmPassword" required>
            </div>
            <div class="form-group">
                <label>Account Type</label>
                <div class="radio-group">
                    <label>
                        <input type="radio" name="accountType" value="student" checked> Student
                    </label>
                    <label>
                        <input type="radio" name="accountType" value="tutor"> Tutor
                    </label>
                </div>
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
    
    // Add event listeners
    const closeBtn = modalContainer.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(modalContainer);
    });
    
    const switchToLoginLink = modalContainer.querySelector('#switch-to-login');
    switchToLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        document.body.removeChild(modalContainer);
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
            alert('Passwords do not match!');
            return;
        }
        
        // Here you would typically make an API call to register the user
        console.log('Signup attempt:', { name, email, password, accountType });
        
        // For demo purposes, simulate a successful registration
        alert('Registration successful!');
        document.body.removeChild(modalContainer);
    });
}
