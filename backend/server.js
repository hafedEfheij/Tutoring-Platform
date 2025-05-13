const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Initialize express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Database setup
let db;

async function initializeDatabase() {
    try {
        // Open database
        db = await open({
            filename: path.join(__dirname, 'database.sqlite'),
            driver: sqlite3.Database
        });

        // Create tables if they don't exist
        await db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                tutor_id INTEGER NOT NULL,
                student_id INTEGER NOT NULL,
                start_time TIMESTAMP NOT NULL,
                end_time TIMESTAMP NOT NULL,
                status TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tutor_id) REFERENCES users (id),
                FOREIGN KEY (student_id) REFERENCES users (id)
            );

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

        console.log('Database initialized');
    } catch (error) {
        console.error('Database initialization error:', error);
    }
}

// JWT secret
const JWT_SECRET = 'your-secret-key'; // In production, use environment variable

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Forbidden' });
        req.user = user;
        next();
    });
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Auth routes
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Validate input
        if (!name || !email || !password || !role) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if user already exists
        const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const result = await db.run(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, role]
        );

        // Generate token
        const token = jwt.sign({ id: result.lastID, email, role }, JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({ token, user: { id: result.lastID, name, email, role } });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Session routes
app.get('/api/sessions', authenticateToken, async (req, res) => {
    try {
        const { id, role } = req.user;
        let sessions;

        if (role === 'tutor') {
            sessions = await db.all('SELECT * FROM sessions WHERE tutor_id = ?', [id]);
        } else {
            sessions = await db.all('SELECT * FROM sessions WHERE student_id = ?', [id]);
        }

        res.json(sessions);
    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/sessions', authenticateToken, async (req, res) => {
    try {
        const { title, tutor_id, start_time, end_time } = req.body;
        const student_id = req.user.id;

        // Validate input
        if (!title || !tutor_id || !start_time || !end_time) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Insert session
        const result = await db.run(
            'INSERT INTO sessions (title, tutor_id, student_id, start_time, end_time, status) VALUES (?, ?, ?, ?, ?, ?)',
            [title, tutor_id, student_id, start_time, end_time, 'scheduled']
        );

        res.status(201).json({ id: result.lastID, title, tutor_id, student_id, start_time, end_time, status: 'scheduled' });
    } catch (error) {
        console.error('Create session error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get session details
app.get('/api/sessions/:id', authenticateToken, async (req, res) => {
    try {
        const sessionId = req.params.id;
        const { id, role } = req.user;

        // Get session details
        const session = await db.get(
            `SELECT s.*,
            t.name as tutor_name, t.email as tutor_email,
            st.name as student_name, st.email as student_email
            FROM sessions s
            JOIN users t ON s.tutor_id = t.id
            JOIN users st ON s.student_id = st.id
            WHERE s.id = ?`,
            [sessionId]
        );

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Check if user is authorized to access this session
        if (role === 'tutor' && session.tutor_id !== id) {
            return res.status(403).json({ error: 'Unauthorized' });
        } else if (role === 'student' && session.student_id !== id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Get messages for this session
        const messages = await db.all(
            `SELECT m.*, u.name as sender_name
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.session_id = ?
            ORDER BY m.created_at ASC`,
            [sessionId]
        );

        res.json({
            session,
            messages
        });
    } catch (error) {
        console.error('Get session details error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// WebSocket for real-time communication
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Store user information
    let currentUser = {
        socketId: socket.id,
        userId: null,
        roomId: null
    };

    // Join session room
    socket.on('join-session', (data) => {
        const { sessionId, userId, userName, userRole } = data;

        // Update current user info
        currentUser.userId = userId;
        currentUser.roomId = sessionId;
        currentUser.userName = userName;
        currentUser.userRole = userRole;

        // Join the room
        socket.join(`session-${sessionId}`);
        console.log(`Client ${socket.id} (${userName}) joined session ${sessionId}`);

        // Notify others in the room
        socket.to(`session-${sessionId}`).emit('user-joined', {
            userId,
            userName,
            userRole,
            socketId: socket.id
        });

        // Send the number of participants to the client
        const room = io.sockets.adapter.rooms.get(`session-${sessionId}`);
        const numParticipants = room ? room.size : 0;

        socket.emit('session-info', {
            sessionId,
            numParticipants
        });
    });

    // Handle whiteboard drawing
    socket.on('draw', (data) => {
        socket.to(`session-${data.sessionId}`).emit('draw', data);
    });

    // Handle chat messages
    socket.on('message', async (data) => {
        try {
            // Add timestamp if not provided
            if (!data.timestamp) {
                data.timestamp = new Date().toISOString();
            }

            // Save message to database if we have a valid session and sender
            if (data.sessionId && data.senderId) {
                await db.run(
                    'INSERT INTO messages (session_id, sender_id, content) VALUES (?, ?, ?)',
                    [data.sessionId, data.senderId, data.content]
                );
            }

            // Broadcast message to session room
            io.to(`session-${data.sessionId}`).emit('message', data);
        } catch (error) {
            console.error('Message error:', error);
        }
    });

    // WebRTC Signaling

    // Handle offer from a peer
    socket.on('offer', (data) => {
        console.log(`Received offer from ${socket.id} for room ${data.roomId}`);

        // Forward the offer to the other peer in the room
        socket.to(`session-${data.roomId}`).emit('offer', {
            offer: data.offer,
            userId: data.userId,
            userName: data.userName,
            userRole: data.userRole
        });
    });

    // Handle answer from a peer
    socket.on('answer', (data) => {
        console.log(`Received answer from ${socket.id} for room ${data.roomId}`);

        // Forward the answer to the other peer in the room
        socket.to(`session-${data.roomId}`).emit('answer', {
            answer: data.answer,
            userId: data.userId
        });
    });

    // Handle ICE candidate from a peer
    socket.on('ice-candidate', (data) => {
        console.log(`Received ICE candidate from ${socket.id} for room ${data.roomId}`);

        // Forward the ICE candidate to the other peer in the room
        socket.to(`session-${data.roomId}`).emit('ice-candidate', {
            candidate: data.candidate,
            userId: data.userId
        });
    });

    // Handle session recording
    socket.on('start-recording', (data) => {
        console.log(`Recording started in session ${data.sessionId}`);
        io.to(`session-${data.sessionId}`).emit('recording-started', {
            userId: data.userId,
            userName: data.userName
        });
    });

    socket.on('stop-recording', (data) => {
        console.log(`Recording stopped in session ${data.sessionId}`);
        io.to(`session-${data.sessionId}`).emit('recording-stopped', {
            userId: data.userId,
            userName: data.userName
        });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);

        // Notify others in the room if the user was in a session
        if (currentUser.roomId) {
            socket.to(`session-${currentUser.roomId}`).emit('user-left', {
                userId: currentUser.userId,
                userName: currentUser.userName
            });
        }
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await initializeDatabase();
});
