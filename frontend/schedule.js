// Schedule JavaScript

document.addEventListener('DOMContentLoaded', () => {
    console.log('Schedule Initialized');

    // Check if user is logged in
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || !user.id) {
        // Redirect to login page if not logged in
        window.location.href = 'login.html';
        return;
    }

    // Initialize mini calendar
    initMiniCalendar();

    // Initialize FullCalendar
    initFullCalendar();

    // Initialize event listeners
    initEventListeners();

    // Initialize booking form
    initBookingForm();

    // Initialize calendar integration
    initCalendarIntegration();
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

        // Get reminder options
        const reminderEmail = document.getElementById('reminder-email').checked;
        const reminderSMS = document.getElementById('reminder-sms').checked;
        const reminderPush = document.getElementById('reminder-push').checked;

        // Get reminder timing
        const reminderTime = document.getElementById('reminder-time').value;

        // Get additional reminders
        const additionalReminders = [];
        const additionalReminderElements = document.querySelectorAll('.additional-reminder select');
        additionalReminderElements.forEach(element => {
            additionalReminders.push(element.value);
        });

        const formData = {
            subject: bookingForm.subject.value,
            tutor: bookingForm.tutor.options[bookingForm.tutor.selectedIndex].text,
            date: bookingForm.date.value,
            time: bookingForm.time.value,
            duration: bookingForm.duration.value,
            notes: bookingForm.notes.value,
            reminders: {
                email: reminderEmail,
                sms: reminderSMS,
                push: reminderPush,
                timing: reminderTime,
                additional: additionalReminders
            }
        };

        // In a real app, this would send the data to the backend
        console.log('Booking data:', formData);

        // For demo, we'll show a more detailed alert
        let reminderText = 'Reminders: ';
        if (reminderEmail) reminderText += 'Email, ';
        if (reminderSMS) reminderText += 'SMS, ';
        if (reminderPush) reminderText += 'Push, ';
        reminderText = reminderText.slice(0, -2); // Remove trailing comma and space

        let timingText = `${reminderTime} minutes before`;
        if (reminderTime === '60') timingText = '1 hour before';
        if (reminderTime === '120') timingText = '2 hours before';
        if (reminderTime === '1440') timingText = '1 day before';

        let additionalText = '';
        if (additionalReminders.length > 0) {
            additionalText = '\nAdditional reminders: ';
            additionalReminders.forEach(timing => {
                let timingStr = `${timing} minutes before`;
                if (timing === '60') timingStr = '1 hour before';
                if (timing === '120') timingStr = '2 hours before';
                if (timing === '1440') timingStr = '1 day before';
                additionalText += timingStr + ', ';
            });
            additionalText = additionalText.slice(0, -2); // Remove trailing comma and space
        }

        alert(`Session booked!\n\nSubject: ${formData.subject}\nTutor: ${formData.tutor}\nDate: ${formData.date}\nTime: ${formData.time}\nDuration: ${formData.duration} minutes\n\n${reminderText}\nTiming: ${timingText}${additionalText}`);

        // Add event to calendar
        if (window.calendar) {
            window.calendar.addEvent({
                title: `${formData.subject} with ${formData.tutor}`,
                start: `${formData.date}T${formData.time}:00`,
                end: moment(`${formData.date}T${formData.time}:00`).add(parseInt(formData.duration), 'minutes').format('YYYY-MM-DDTHH:mm:ss'),
                extendedProps: {
                    tutor: formData.tutor
                }
            });
        }

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

// Initialize FullCalendar
function initFullCalendar() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;

    // Sample events data
    const events = [
        {
            title: 'Introduction to Algebra',
            start: '2025-05-15T10:00:00',
            end: '2025-05-15T11:00:00',
            extendedProps: {
                tutor: 'Dr. Sarah Johnson'
            }
        },
        {
            title: 'Advanced Calculus',
            start: '2025-05-17T14:00:00',
            end: '2025-05-17T15:00:00',
            extendedProps: {
                tutor: 'Prof. Michael Chen'
            }
        },
        {
            title: 'Physics Fundamentals',
            start: '2025-05-20T11:00:00',
            end: '2025-05-20T12:00:00',
            extendedProps: {
                tutor: 'Dr. Emily Wilson'
            }
        }
    ];

    // Initialize FullCalendar
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        events: events,
        eventClick: function(info) {
            // Show event details
            const event = info.event;
            const title = event.title;
            const start = moment(event.start).format('MMMM D, YYYY h:mm A');
            const end = moment(event.end).format('h:mm A');
            const tutor = event.extendedProps.tutor;

            alert(`Session: ${title}\nTime: ${start} - ${end}\nTutor: ${tutor}`);
        },
        dateClick: function(info) {
            // Open booking modal when clicking on a date
            const bookingModal = document.querySelector('.booking-modal');
            const dateInput = document.getElementById('date');

            // Set the selected date in the booking form
            dateInput.value = info.dateStr;

            // Show the booking modal
            bookingModal.hidden = false;
        }
    });

    // Render the calendar
    calendar.render();
}

// Initialize calendar integration
function initCalendarIntegration() {
    // Google Calendar integration
    const googleCalendarBtn = document.getElementById('google-calendar-btn');
    if (googleCalendarBtn) {
        googleCalendarBtn.addEventListener('click', () => {
            connectToGoogleCalendar();
        });
    }

    // Outlook Calendar integration
    const outlookCalendarBtn = document.getElementById('outlook-calendar-btn');
    if (outlookCalendarBtn) {
        outlookCalendarBtn.addEventListener('click', () => {
            connectToOutlookCalendar();
        });
    }

    // Apple Calendar integration
    const appleCalendarBtn = document.getElementById('apple-calendar-btn');
    if (appleCalendarBtn) {
        appleCalendarBtn.addEventListener('click', () => {
            connectToAppleCalendar();
        });
    }

    // Export calendar
    const exportCalendarBtn = document.getElementById('export-calendar-btn');
    if (exportCalendarBtn) {
        exportCalendarBtn.addEventListener('click', () => {
            exportCalendar();
        });
    }

    // Add reminder button
    const addReminderBtn = document.getElementById('add-reminder');
    if (addReminderBtn) {
        addReminderBtn.addEventListener('click', () => {
            addAdditionalReminder();
        });
    }
}

// Connect to Google Calendar
function connectToGoogleCalendar() {
    // In a real app, this would open the Google OAuth flow
    alert('This would connect to your Google Calendar account.\n\nIn a real implementation, this would use the Google Calendar API to sync your sessions.');

    // Simulate successful connection
    const googleCalendarBtn = document.getElementById('google-calendar-btn');
    googleCalendarBtn.textContent = 'Connected';
    googleCalendarBtn.disabled = true;
    googleCalendarBtn.style.backgroundColor = 'var(--success-color)';
    googleCalendarBtn.style.color = 'white';
}

// Connect to Outlook Calendar
function connectToOutlookCalendar() {
    // In a real app, this would open the Microsoft OAuth flow
    alert('This would connect to your Outlook Calendar account.\n\nIn a real implementation, this would use the Microsoft Graph API to sync your sessions.');

    // Simulate successful connection
    const outlookCalendarBtn = document.getElementById('outlook-calendar-btn');
    outlookCalendarBtn.textContent = 'Connected';
    outlookCalendarBtn.disabled = true;
    outlookCalendarBtn.style.backgroundColor = 'var(--success-color)';
    outlookCalendarBtn.style.color = 'white';
}

// Connect to Apple Calendar
function connectToAppleCalendar() {
    // In a real app, this would provide instructions for iCloud Calendar
    alert('This would provide instructions for connecting to your Apple Calendar.\n\nIn a real implementation, this would generate an iCalendar subscription URL that you can add to your Apple Calendar.');

    // Simulate successful connection
    const appleCalendarBtn = document.getElementById('apple-calendar-btn');
    appleCalendarBtn.textContent = 'Connected';
    appleCalendarBtn.disabled = true;
    appleCalendarBtn.style.backgroundColor = 'var(--success-color)';
    appleCalendarBtn.style.color = 'white';
}

// Export calendar as iCalendar file
function exportCalendar() {
    // In a real app, this would generate an iCalendar file
    alert('This would generate an iCalendar (.ics) file with all your scheduled sessions.\n\nIn a real implementation, this would create a file that you can import into any calendar app.');

    // Simulate download
    const link = document.createElement('a');
    link.href = 'data:text/calendar;charset=utf-8,BEGIN:VCALENDAR%0AVERSION:2.0%0APRODID:-//TutorConnect//EN%0ACALSCALE:GREGORIAN%0AMETHOD:PUBLISH%0ABEGIN:VEVENT%0ASUMMARY:Introduction to Algebra%0ADTSTART:20250515T100000%0ADTEND:20250515T110000%0ADESCRIPTION:Tutor: Dr. Sarah Johnson%0AEND:VEVENT%0AEND:VCALENDAR';
    link.download = 'tutorconnect-calendar.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Add additional reminder
function addAdditionalReminder() {
    const additionalReminders = document.getElementById('additional-reminders');
    const reminderCount = additionalReminders.children.length + 1;

    if (reminderCount > 3) {
        alert('You can add up to 3 additional reminders.');
        return;
    }

    const reminderDiv = document.createElement('div');
    reminderDiv.className = 'additional-reminder';
    reminderDiv.innerHTML = `
        <select name="additional-reminder-${reminderCount}">
            <option value="15">15 minutes before</option>
            <option value="30">30 minutes before</option>
            <option value="60">1 hour before</option>
            <option value="120">2 hours before</option>
            <option value="1440">1 day before</option>
        </select>
        <button type="button" class="remove-reminder">&times;</button>
    `;

    // Add event listener to remove button
    const removeButton = reminderDiv.querySelector('.remove-reminder');
    removeButton.addEventListener('click', () => {
        additionalReminders.removeChild(reminderDiv);
    });

    additionalReminders.appendChild(reminderDiv);
}
