/**
 * Database Seeding Script for TutorConnect
 * This script populates the database with realistic sample data
 */

const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const bcrypt = require('bcrypt');

// Sample data
const users = [
    // Tutors
    {
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@example.com',
        password: 'Password123!',
        role: 'tutor',
        bio: 'Mathematics professor with 10+ years of teaching experience. Specializes in calculus and linear algebra.',
        subjects: ['Mathematics', 'Calculus', 'Linear Algebra'],
        hourlyRate: 50,
        availability: 'Weekdays evenings, Weekends'
    },
    {
        name: 'Prof. Michael Chen',
        email: 'michael.chen@example.com',
        password: 'Password123!',
        role: 'tutor',
        bio: 'Physics PhD with expertise in quantum mechanics and theoretical physics. Passionate about making complex concepts accessible.',
        subjects: ['Physics', 'Quantum Mechanics', 'Theoretical Physics'],
        hourlyRate: 60,
        availability: 'Weekends, Monday and Wednesday evenings'
    },
    {
        name: 'Emma Rodriguez',
        email: 'emma.rodriguez@example.com',
        password: 'Password123!',
        role: 'tutor',
        bio: 'Certified language instructor specializing in Spanish and French. Interactive teaching approach with focus on conversation.',
        subjects: ['Spanish', 'French', 'ESL'],
        hourlyRate: 40,
        availability: 'Flexible schedule, available most days'
    },
    {
        name: 'Dr. James Wilson',
        email: 'james.wilson@example.com',
        password: 'Password123!',
        role: 'tutor',
        bio: 'Computer Science professor with industry experience. Expert in algorithms, data structures, and machine learning.',
        subjects: ['Computer Science', 'Algorithms', 'Machine Learning'],
        hourlyRate: 65,
        availability: 'Tuesday and Thursday evenings, Saturday mornings'
    },
    {
        name: 'Olivia Thompson',
        email: 'olivia.thompson@example.com',
        password: 'Password123!',
        role: 'tutor',
        bio: 'Literature and writing coach with MFA in Creative Writing. Helps students develop critical analysis and writing skills.',
        subjects: ['English Literature', 'Creative Writing', 'Essay Writing'],
        hourlyRate: 45,
        availability: 'Weekday afternoons, Sunday all day'
    },

    // Students
    {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'Password123!',
        role: 'student',
        bio: 'Undergraduate student majoring in Computer Science. Looking for help with advanced algorithms and data structures.',
        interests: ['Programming', 'Algorithms', 'Data Structures']
    },
    {
        name: 'Emily Smith',
        email: 'emily.smith@example.com',
        password: 'Password123!',
        role: 'student',
        bio: 'High school senior preparing for AP Calculus exam. Need help with integration techniques and applications.',
        interests: ['Mathematics', 'Calculus', 'AP Exam Prep']
    },
    {
        name: 'Alex Johnson',
        email: 'alex.johnson@example.com',
        password: 'Password123!',
        role: 'student',
        bio: 'Graduate student in Physics looking for advanced quantum mechanics tutoring.',
        interests: ['Physics', 'Quantum Mechanics', 'Theoretical Physics']
    },
    {
        name: 'Sophia Garcia',
        email: 'sophia.garcia@example.com',
        password: 'Password123!',
        role: 'student',
        bio: 'Business major wanting to improve Spanish language skills for international business opportunities.',
        interests: ['Spanish', 'Business Spanish', 'Conversation Practice']
    },
    {
        name: 'Ethan Williams',
        email: 'ethan.williams@example.com',
        password: 'Password123!',
        role: 'student',
        bio: 'English Literature major needing help with essay writing and literary analysis for upcoming thesis.',
        interests: ['English Literature', 'Essay Writing', 'Literary Analysis']
    }
];

// Sample sessions (tutoring appointments)
const sessions = [
    {
        title: 'Calculus Integration Techniques',
        tutor_id: 1, // Sarah Johnson
        student_id: 7, // Emily Smith
        start_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
        end_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // 1 hour later
        status: 'scheduled',
        description: 'Focus on integration by parts and substitution methods for AP Calculus exam preparation.'
    },
    {
        title: 'Quantum Mechanics Problem Solving',
        tutor_id: 2, // Michael Chen
        student_id: 8, // Alex Johnson
        start_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        end_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(), // 1.5 hours later
        status: 'scheduled',
        description: 'Advanced problem-solving session focusing on Schrödinger equation applications.'
    },
    {
        title: 'Spanish Conversation Practice',
        tutor_id: 3, // Emma Rodriguez
        student_id: 9, // Sophia Garcia
        start_time: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
        end_time: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // 1 hour later
        status: 'scheduled',
        description: 'Business Spanish vocabulary and conversation practice for international contexts.'
    },
    {
        title: 'Algorithm Optimization Strategies',
        tutor_id: 4, // James Wilson
        student_id: 6, // John Doe
        start_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        end_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // 1 hour later
        status: 'completed',
        description: 'Review of time complexity analysis and optimization techniques for sorting algorithms.'
    },
    {
        title: 'Essay Structure and Thesis Development',
        tutor_id: 5, // Olivia Thompson
        student_id: 10, // Ethan Williams
        start_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        end_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // 1 hour later
        status: 'completed',
        description: 'Working on thesis statement development and supporting argument structure.'
    }
];

// Sample messages
const messages = [
    // Messages for completed Algorithm session
    {
        session_id: 4,
        sender_id: 6, // John Doe (student)
        content: 'Hello Dr. Wilson, I\'m looking forward to our session on algorithm optimization.',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
    },
    {
        session_id: 4,
        sender_id: 4, // James Wilson (tutor)
        content: 'Hi John, I\'m preparing some examples on sorting algorithm optimizations. Do you have any specific algorithms you\'d like to focus on?',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString() // 30 minutes later
    },
    {
        session_id: 4,
        sender_id: 6, // John Doe (student)
        content: 'I\'m particularly struggling with quicksort and its optimizations. Also interested in understanding when to use different sorting algorithms.',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString() // 15 minutes later
    },
    {
        session_id: 4,
        sender_id: 4, // James Wilson (tutor)
        content: 'Perfect, I\'ll focus on quicksort optimizations and comparative analysis between different sorting algorithms. See you tomorrow!',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString() // 15 minutes later
    },
    {
        session_id: 4,
        sender_id: 6, // John Doe (student)
        content: 'Thank you for the session today! Your explanation of pivot selection strategies in quicksort was very helpful.',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 70 * 60 * 1000).toISOString() // After session
    },
    {
        session_id: 4,
        sender_id: 4, // James Wilson (tutor)
        content: 'You\'re welcome, John! I\'ve shared some additional resources on algorithm complexity analysis in our shared folder. Let me know if you\'d like to schedule a follow-up session.',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 80 * 60 * 1000).toISOString() // 10 minutes later
    },

    // Messages for upcoming Calculus session
    {
        session_id: 1,
        sender_id: 7, // Emily Smith (student)
        content: 'Dr. Johnson, I\'m preparing for our integration techniques session. Are there any specific problems I should review beforehand?',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
    },
    {
        session_id: 1,
        sender_id: 1, // Sarah Johnson (tutor)
        content: 'Hi Emily, please review the basic integration rules and substitution method. I\'ll be focusing on integration by parts and some trickier substitutions that often appear on the AP exam.',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString() // 45 minutes later
    },
    {
        session_id: 1,
        sender_id: 7, // Emily Smith (student)
        content: 'Thank you! I\'ll review those topics. Also, would it be possible to go over some of the integration problems from the practice exam I sent you?',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString() // 15 minutes later
    },
    {
        session_id: 1,
        sender_id: 1, // Sarah Johnson (tutor)
        content: 'Absolutely! I\'ve looked at those problems and will incorporate them into our session. They\'re excellent examples of the techniques we\'ll be covering.',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString() // 30 minutes later
    }
];

// Function to seed the database
async function seedDatabase() {
    try {
        // Open database connection
        const db = await open({
            filename: path.join(__dirname, 'database.sqlite'),
            driver: sqlite3.Database
        });

        console.log('Connected to database');

        // Drop existing tables if they exist
        await db.exec(`
            DROP TABLE IF EXISTS reviews;
            DROP TABLE IF EXISTS tutor_profiles;
            DROP TABLE IF EXISTS student_profiles;
            DROP TABLE IF EXISTS messages;
            DROP TABLE IF EXISTS sessions;
            DROP TABLE IF EXISTS users;
        `);

        console.log('Dropped existing tables');

        // Create tables for users, sessions, and messages if they don't exist
        await db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL,
                google_id TEXT,
                facebook_id TEXT,
                profile_picture TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await db.exec(`
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                tutor_id INTEGER NOT NULL,
                student_id INTEGER NOT NULL,
                start_time TIMESTAMP NOT NULL,
                end_time TIMESTAMP NOT NULL,
                status TEXT NOT NULL,
                description TEXT,
                recording_url TEXT,
                whiteboard_data TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tutor_id) REFERENCES users (id),
                FOREIGN KEY (student_id) REFERENCES users (id)
            );
        `);

        await db.exec(`
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                sender_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions (id),
                FOREIGN KEY (sender_id) REFERENCES users (id)
            );
        `);

        // Create additional tables for user profiles and reviews
        await db.exec(`
            CREATE TABLE IF NOT EXISTS tutor_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                bio TEXT,
                subjects TEXT,
                hourly_rate REAL,
                availability TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            );
        `);

        await db.exec(`
            CREATE TABLE IF NOT EXISTS student_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                bio TEXT,
                interests TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            );
        `);

        await db.exec(`
            CREATE TABLE IF NOT EXISTS reviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                reviewer_id INTEGER NOT NULL,
                reviewee_id INTEGER NOT NULL,
                rating INTEGER NOT NULL,
                comment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions (id),
                FOREIGN KEY (reviewer_id) REFERENCES users (id),
                FOREIGN KEY (reviewee_id) REFERENCES users (id)
            );
        `);

        console.log('Additional tables created');

        // Insert users
        for (const user of users) {
            // Hash password
            const hashedPassword = await bcrypt.hash(user.password, 12);

            // Insert user
            const result = await db.run(
                'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                [user.name, user.email, hashedPassword, user.role]
            );

            const userId = result.lastID;

            // Insert profile data based on role
            if (user.role === 'tutor') {
                await db.run(
                    'INSERT INTO tutor_profiles (user_id, bio, subjects, hourly_rate, availability) VALUES (?, ?, ?, ?, ?)',
                    [userId, user.bio, JSON.stringify(user.subjects), user.hourlyRate, user.availability]
                );
            } else {
                await db.run(
                    'INSERT INTO student_profiles (user_id, bio, interests) VALUES (?, ?, ?)',
                    [userId, user.bio, JSON.stringify(user.interests)]
                );
            }
        }

        console.log('Users and profiles inserted');

        // Insert sessions
        for (const session of sessions) {
            await db.run(
                'INSERT INTO sessions (title, tutor_id, student_id, start_time, end_time, status, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [session.title, session.tutor_id, session.student_id, session.start_time, session.end_time, session.status, session.description]
            );
        }

        console.log('Sessions inserted');

        // Insert messages
        for (const message of messages) {
            await db.run(
                'INSERT INTO messages (session_id, sender_id, content, created_at) VALUES (?, ?, ?, ?)',
                [message.session_id, message.sender_id, message.content, message.created_at]
            );
        }

        console.log('Messages inserted');

        // Add some reviews for completed sessions
        const reviews = [
            {
                session_id: 4, // Algorithm session
                reviewer_id: 6, // John Doe (student)
                reviewee_id: 4, // James Wilson (tutor)
                rating: 5,
                comment: 'Dr. Wilson explained complex algorithm concepts clearly and provided excellent examples. Highly recommend!'
            },
            {
                session_id: 5, // Essay session
                reviewer_id: 10, // Ethan Williams (student)
                reviewee_id: 5, // Olivia Thompson (tutor)
                rating: 4,
                comment: 'Very helpful session on essay structure. Ms. Thompson provided great feedback on my thesis statement.'
            }
        ];

        for (const review of reviews) {
            await db.run(
                'INSERT INTO reviews (session_id, reviewer_id, reviewee_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
                [review.session_id, review.reviewer_id, review.reviewee_id, review.rating, review.comment]
            );
        }

        console.log('Reviews inserted');

        console.log('Database seeding completed successfully');

        // Close database connection
        await db.close();
    } catch (error) {
        console.error('Error seeding database:', error);
    }
}

// Run the seeding function
seedDatabase();
