// Dashboard JavaScript

document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard Initialized');
    
    // Check if user is logged in (would normally check with backend)
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
        // Redirect to login page if not logged in
        // window.location.href = 'index.html';
        console.log('User not logged in, but allowing access for demo purposes');
    }
    
    // Initialize event listeners
    initEventListeners();
    
    // Load user data
    loadUserData();
    
    // Load upcoming sessions
    loadUpcomingSessions();
    
    // Load recommended tutors
    loadRecommendedTutors();
});

function initEventListeners() {
    // Join session buttons
    const joinSessionButtons = document.querySelectorAll('.session-actions .primary-btn');
    joinSessionButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const sessionCard = e.target.closest('.session-card');
            const sessionTitle = sessionCard.querySelector('.session-title').textContent;
            console.log(`Joining session: ${sessionTitle}`);
            
            // In a real app, this would redirect to the video call page
            alert(`Joining session: ${sessionTitle}`);
        });
    });
    
    // Reschedule buttons
    const rescheduleButtons = document.querySelectorAll('.session-actions .secondary-btn');
    rescheduleButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const sessionCard = e.target.closest('.session-card');
            const sessionTitle = sessionCard.querySelector('.session-title').textContent;
            console.log(`Rescheduling session: ${sessionTitle}`);
            
            // In a real app, this would open a reschedule modal
            alert(`Rescheduling session: ${sessionTitle}`);
        });
    });
    
    // Book session buttons
    const bookSessionButtons = document.querySelectorAll('.tutor-card .primary-btn');
    bookSessionButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const tutorCard = e.target.closest('.tutor-card');
            const tutorName = tutorCard.querySelector('.tutor-name').textContent;
            console.log(`Booking session with: ${tutorName}`);
            
            // In a real app, this would open a booking modal
            alert(`Booking session with: ${tutorName}`);
        });
    });
    
    // Sidebar menu items
    const sidebarMenuItems = document.querySelectorAll('.sidebar-menu li');
    sidebarMenuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            // Remove active class from all items
            sidebarMenuItems.forEach(i => i.classList.remove('active'));
            
            // Add active class to clicked item
            item.classList.add('active');
            
            // Prevent default link behavior for demo
            e.preventDefault();
            
            const menuText = item.textContent.trim();
            console.log(`Navigating to: ${menuText}`);
        });
    });
    
    // User menu
    const userMenu = document.querySelector('.user-menu');
    if (userMenu) {
        userMenu.addEventListener('click', () => {
            console.log('User menu clicked');
            
            // In a real app, this would show a dropdown menu
            const actions = ['Profile', 'Account Settings', 'Logout'];
            const action = prompt(`Select an action:\n1. ${actions[0]}\n2. ${actions[1]}\n3. ${actions[2]}`);
            
            if (action === '3') {
                // Logout
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('userData');
                window.location.href = 'index.html';
            }
        });
    }
}

function loadUserData() {
    // In a real app, this would fetch user data from the backend
    // For demo purposes, we'll use mock data
    const userData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        completedSessions: 12,
        upcomingSessions: 3,
        hoursLearned: 8,
        averageRating: 4.8
    };
    
    // Store user data in localStorage for demo purposes
    localStorage.setItem('userData', JSON.stringify(userData));
    localStorage.setItem('isLoggedIn', 'true');
    
    // Update UI with user data
    document.querySelector('.dashboard-header h1').textContent = `Welcome back, ${userData.name.split(' ')[0]}!`;
    document.querySelector('.user-name').textContent = userData.name;
    
    // Update stats
    const statValues = document.querySelectorAll('.stat-value');
    statValues[0].textContent = userData.completedSessions;
    statValues[1].textContent = userData.upcomingSessions;
    statValues[2].textContent = userData.hoursLearned;
    statValues[3].textContent = userData.averageRating;
}

function loadUpcomingSessions() {
    // In a real app, this would fetch upcoming sessions from the backend
    // For demo purposes, we're using the hardcoded sessions in the HTML
    console.log('Loaded upcoming sessions');
}

function loadRecommendedTutors() {
    // In a real app, this would fetch recommended tutors from the backend
    // For demo purposes, we're using the hardcoded tutors in the HTML
    console.log('Loaded recommended tutors');
}
