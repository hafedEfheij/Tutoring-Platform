// Dashboard JavaScript

document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard Initialized');

    // Check if user is logged in
    const token = sessionStorage.getItem('token');
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');

    if (!token) {
        // Redirect to login page if not logged in
        window.location.href = 'index.html';
        return;
    }

    // Initialize event listeners
    initEventListeners();

    // Load user data
    loadUserData(user);

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

            // Create dropdown menu
            const dropdown = document.createElement('div');
            dropdown.className = 'user-dropdown';
            dropdown.innerHTML = `
                <ul>
                    <li data-action="profile">Profile</li>
                    <li data-action="settings">Account Settings</li>
                    <li data-action="logout">Logout</li>
                </ul>
            `;

            // Position dropdown
            const rect = userMenu.getBoundingClientRect();
            dropdown.style.position = 'absolute';
            dropdown.style.top = `${rect.bottom}px`;
            dropdown.style.right = `${window.innerWidth - rect.right}px`;
            dropdown.style.backgroundColor = 'white';
            dropdown.style.boxShadow = 'var(--box-shadow)';
            dropdown.style.borderRadius = '0.375rem';
            dropdown.style.zIndex = '100';

            // Style dropdown items
            const dropdownItems = dropdown.querySelectorAll('li');
            dropdownItems.forEach(item => {
                item.style.padding = '0.75rem 1.5rem';
                item.style.cursor = 'pointer';
                item.style.transition = 'all 0.2s ease';

                item.addEventListener('mouseenter', () => {
                    item.style.backgroundColor = 'var(--secondary-color)';
                });

                item.addEventListener('mouseleave', () => {
                    item.style.backgroundColor = 'transparent';
                });

                item.addEventListener('click', () => {
                    const action = item.dataset.action;

                    if (action === 'logout') {
                        // Logout
                        sessionStorage.removeItem('token');
                        sessionStorage.removeItem('user');
                        window.location.href = 'index.html';
                    } else if (action === 'profile') {
                        alert('Profile page would open here');
                    } else if (action === 'settings') {
                        alert('Account settings would open here');
                    }

                    // Remove dropdown
                    document.body.removeChild(dropdown);
                });
            });

            // Add dropdown to body
            document.body.appendChild(dropdown);

            // Close dropdown when clicking outside
            const closeDropdown = (e) => {
                if (!dropdown.contains(e.target) && !userMenu.contains(e.target)) {
                    document.body.removeChild(dropdown);
                    document.removeEventListener('click', closeDropdown);
                }
            };

            // Add delay to prevent immediate closing
            setTimeout(() => {
                document.addEventListener('click', closeDropdown);
            }, 100);
        });
    }
}

async function loadUserData(user) {
    try {
        // In a real app, this would fetch additional user data from the backend
        // For now, we'll use the user data from localStorage and add some mock stats
        const userData = {
            ...user,
            completedSessions: 12,
            upcomingSessions: 3,
            hoursLearned: 8,
            averageRating: 4.8
        };

        // Update UI with user data
        document.querySelector('.dashboard-header h1').textContent = `Welcome back, ${userData.name.split(' ')[0]}!`;
        document.querySelector('.user-name').textContent = userData.name;

        // Update user avatar if available
        const userAvatar = document.querySelector('.user-avatar img');
        if (userAvatar && userData.avatar) {
            userAvatar.src = userData.avatar;
        }

        // Update stats
        const statValues = document.querySelectorAll('.stat-value');
        statValues[0].textContent = userData.completedSessions;
        statValues[1].textContent = userData.upcomingSessions;
        statValues[2].textContent = userData.hoursLearned;
        statValues[3].textContent = userData.averageRating;

        // In a real app, we would fetch this data from the backend
        // For example:
        /*
        const token = localStorage.getItem('token');
        const response = await fetch('/api/user/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const stats = await response.json();
            statValues[0].textContent = stats.completedSessions;
            statValues[1].textContent = stats.upcomingSessions;
            statValues[2].textContent = stats.hoursLearned;
            statValues[3].textContent = stats.averageRating;
        }
        */
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

async function loadUpcomingSessions() {
    try {
        // In a real app, this would fetch upcoming sessions from the backend
        // For example:
        /*
        const token = localStorage.getItem('token');
        const response = await fetch('/api/sessions/upcoming', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const sessions = await response.json();

            // Clear existing sessions
            const sessionContainer = document.querySelector('.session-cards');
            sessionContainer.innerHTML = '';

            // Add sessions to the UI
            sessions.forEach(session => {
                const sessionCard = document.createElement('div');
                sessionCard.className = 'session-card';
                sessionCard.innerHTML = `
                    <div class="session-time">
                        <div class="date">${formatDate(session.start_time)}</div>
                        <div class="time">${formatTime(session.start_time)} - ${formatTime(session.end_time)}</div>
                    </div>
                    <div class="session-details">
                        <div class="session-title">${session.title}</div>
                        <div class="tutor-name">with ${session.tutor_name}</div>
                    </div>
                    <div class="session-actions">
                        <button class="primary-btn">Join Session</button>
                        <button class="secondary-btn">Reschedule</button>
                    </div>
                `;

                sessionContainer.appendChild(sessionCard);
            });
        }
        */

        // For demo purposes, we're using the hardcoded sessions in the HTML
        console.log('Loaded upcoming sessions');
    } catch (error) {
        console.error('Error loading upcoming sessions:', error);
    }
}

async function loadRecommendedTutors() {
    try {
        // In a real app, this would fetch recommended tutors from the backend
        // For example:
        /*
        const token = localStorage.getItem('token');
        const response = await fetch('/api/tutors/recommended', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const tutors = await response.json();

            // Clear existing tutors
            const tutorContainer = document.querySelector('.tutor-cards');
            tutorContainer.innerHTML = '';

            // Add tutors to the UI
            tutors.forEach(tutor => {
                const tutorCard = document.createElement('div');
                tutorCard.className = 'tutor-card';
                tutorCard.innerHTML = `
                    <div class="tutor-avatar">
                        <img src="${tutor.avatar || 'https://via.placeholder.com/80'}" alt="Tutor Avatar">
                    </div>
                    <div class="tutor-info">
                        <div class="tutor-name">${tutor.name}</div>
                        <div class="tutor-subject">${tutor.subject}</div>
                        <div class="tutor-rating">⭐ ${tutor.rating} (${tutor.reviews} reviews)</div>
                    </div>
                    <button class="primary-btn">Book Session</button>
                `;

                tutorContainer.appendChild(tutorCard);
            });
        }
        */

        // For demo purposes, we're using the hardcoded tutors in the HTML
        console.log('Loaded recommended tutors');
    } catch (error) {
        console.error('Error loading recommended tutors:', error);
    }
}

// Helper function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Helper function to format time
function formatTime(dateString) {
    const date = new Date(dateString);
    const options = { hour: 'numeric', minute: '2-digit', hour12: true };
    return date.toLocaleTimeString('en-US', options);
}
