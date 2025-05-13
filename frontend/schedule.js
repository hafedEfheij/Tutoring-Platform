// Schedule JavaScript

document.addEventListener('DOMContentLoaded', () => {
    console.log('Schedule Initialized');
    
    // Initialize mini calendar
    initMiniCalendar();
    
    // Initialize event listeners
    initEventListeners();
    
    // Initialize booking form
    initBookingForm();
});

// Current date
const currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

function initMiniCalendar() {
    // Generate calendar days
    generateCalendarDays();
    
    // Set current month text
    updateCurrentMonthText();
    
    // Add event listeners for navigation
    const prevMonthBtn = document.querySelector('.calendar-mini .prev-month');
    const nextMonthBtn = document.querySelector('.calendar-mini .next-month');
    
    prevMonthBtn.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        generateCalendarDays();
        updateCurrentMonthText();
    });
    
    nextMonthBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        generateCalendarDays();
        updateCurrentMonthText();
    });
}

function generateCalendarDays() {
    const calendarDays = document.querySelector('.calendar-days');
    calendarDays.innerHTML = '';
    
    // Get first day of month
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    
    // Get day of week for first day (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = firstDay.getDay();
    
    // Get number of days in previous month
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    
    // Add days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day other-month';
        dayElement.textContent = prevMonthLastDay - i;
        calendarDays.appendChild(dayElement);
    }
    
    // Add days for current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = i;
        
        // Check if day is today
        const today = new Date();
        if (i === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
            dayElement.classList.add('today');
        }
        
        // Check if day has events (for demo, we'll mark some days)
        if (i === 15 || i === 17 || i === 20) {
            dayElement.classList.add('has-event');
        }
        
        // Add click event
        dayElement.addEventListener('click', () => {
            // For demo, we'll just show an alert
            alert(`Selected date: ${i}/${currentMonth + 1}/${currentYear}`);
        });
        
        calendarDays.appendChild(dayElement);
    }
    
    // Add days from next month to fill the grid
    const totalDaysAdded = firstDayOfWeek + lastDay.getDate();
    const remainingDays = 7 - (totalDaysAdded % 7);
    
    if (remainingDays < 7) {
        for (let i = 1; i <= remainingDays; i++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day other-month';
            dayElement.textContent = i;
            calendarDays.appendChild(dayElement);
        }
    }
}

function updateCurrentMonthText() {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Update mini calendar
    document.querySelector('.calendar-mini .current-month').textContent = `${monthNames[currentMonth]} ${currentYear}`;
    
    // Update month view
    document.querySelector('.month-header .current-month-large').textContent = `${monthNames[currentMonth]} ${currentYear}`;
}

function initEventListeners() {
    // View selector
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            viewButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Show selected view
            const view = button.dataset.view;
            document.querySelectorAll('.schedule-view').forEach(view => {
                view.style.display = 'none';
            });
            document.querySelector(`.${view}-view`).style.display = 'block';
        });
    });
    
    // Week navigation
    const prevWeekBtn = document.querySelector('.week-nav.prev-week');
    const nextWeekBtn = document.querySelector('.week-nav.next-week');
    
    prevWeekBtn.addEventListener('click', () => {
        // For demo, we'll just update the text
        const currentWeek = document.querySelector('.current-week').textContent;
        document.querySelector('.current-week').textContent = 'May 8 - May 14, 2025';
    });
    
    nextWeekBtn.addEventListener('click', () => {
        // For demo, we'll just update the text
        const currentWeek = document.querySelector('.current-week').textContent;
        document.querySelector('.current-week').textContent = 'May 22 - May 28, 2025';
    });
    
    // Month navigation
    const prevMonthBtnLarge = document.querySelector('.month-nav.prev-month');
    const nextMonthBtnLarge = document.querySelector('.month-nav.next-month');
    
    prevMonthBtnLarge.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        updateCurrentMonthText();
    });
    
    nextMonthBtnLarge.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        updateCurrentMonthText();
    });
    
    // Events
    const events = document.querySelectorAll('.event');
    events.forEach(event => {
        event.addEventListener('click', () => {
            const title = event.querySelector('.event-title').textContent;
            const time = event.querySelector('.event-time').textContent;
            const tutor = event.querySelector('.event-tutor').textContent;
            
            // For demo, we'll just show an alert
            alert(`Session: ${title}\nTime: ${time}\nTutor: ${tutor}`);
        });
    });
    
    // New session button
    const newSessionBtn = document.getElementById('new-session-btn');
    newSessionBtn.addEventListener('click', () => {
        document.querySelector('.booking-modal').hidden = false;
    });
    
    // Close modal button
    const closeModalBtn = document.querySelector('.close-modal');
    closeModalBtn.addEventListener('click', () => {
        document.querySelector('.booking-modal').hidden = true;
    });
    
    // Click outside modal to close
    const bookingModal = document.querySelector('.booking-modal');
    bookingModal.addEventListener('click', (e) => {
        if (e.target === bookingModal) {
            bookingModal.hidden = true;
        }
    });
}

function initBookingForm() {
    const subjectSelect = document.getElementById('subject');
    const tutorSelect = document.getElementById('tutor');
    
    // Populate tutors based on subject
    subjectSelect.addEventListener('change', () => {
        const subject = subjectSelect.value;
        tutorSelect.innerHTML = '<option value="">Select a tutor</option>';
        
        if (subject === 'math') {
            addTutorOption('Dr. Sarah Johnson', 'sarah.johnson');
            addTutorOption('Prof. Michael Chen', 'michael.chen');
            addTutorOption('Dr. Robert Davis', 'robert.davis');
        } else if (subject === 'physics') {
            addTutorOption('Dr. Emily Wilson', 'emily.wilson');
            addTutorOption('Prof. James Miller', 'james.miller');
        } else if (subject === 'chemistry') {
            addTutorOption('Prof. David Lee', 'david.lee');
            addTutorOption('Dr. Lisa Wang', 'lisa.wang');
        } else if (subject === 'biology') {
            addTutorOption('Dr. Maria Rodriguez', 'maria.rodriguez');
            addTutorOption('Prof. John Smith', 'john.smith');
        } else if (subject === 'english') {
            addTutorOption('Dr. Elizabeth Brown', 'elizabeth.brown');
            addTutorOption('Prof. William Taylor', 'william.taylor');
        }
    });
    
    // Set min date for date picker to today
    const dateInput = document.getElementById('date');
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    dateInput.min = formattedDate;
    dateInput.value = formattedDate;
    
    // Handle form submission
    const bookingForm = document.getElementById('booking-form');
    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = {
            subject: bookingForm.subject.value,
            tutor: bookingForm.tutor.options[bookingForm.tutor.selectedIndex].text,
            date: bookingForm.date.value,
            time: bookingForm.time.value,
            duration: bookingForm.duration.value,
            notes: bookingForm.notes.value
        };
        
        // For demo, we'll just show an alert
        alert(`Session booked!\n\nSubject: ${formData.subject}\nTutor: ${formData.tutor}\nDate: ${formData.date}\nTime: ${formData.time}\nDuration: ${formData.duration} minutes`);
        
        // Close modal
        document.querySelector('.booking-modal').hidden = true;
    });
}

function addTutorOption(name, value) {
    const tutorSelect = document.getElementById('tutor');
    const option = document.createElement('option');
    option.value = value;
    option.textContent = name;
    tutorSelect.appendChild(option);
}
