const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');

// Load environment variables
require('dotenv').config();

// Initialize express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production'
            ? 'https://your-domain.com'
            : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500'],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        credentials: true
    }
});

// Security middleware
app.use(helmet()); // Set security headers
app.use(cookieParser()); // Parse cookies

// Rate limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);

// More strict rate limiting for auth routes
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // limit each IP to 10 login/register attempts per hour
    message: 'Too many login attempts from this IP, please try again after an hour'
});

// CORS configuration
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? 'https://your-domain.com'
        : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500'],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '1mb' })); // Limit request body size
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend'), {
    etag: true, // Enable ETag for caching
    lastModified: true, // Enable Last-Modified for caching
    setHeaders: (res, path) => {
        // Set Cache-Control header for static assets
        if (path.endsWith('.css') || path.endsWith('.js')) {
            res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
        } else if (path.endsWith('.jpg') || path.endsWith('.png') || path.endsWith('.gif')) {
            res.setHeader('Cache-Control', 'public, max-age=604800'); // 1 week
        }
    }
}));

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
                google_id TEXT,
                facebook_id TEXT,
                profile_picture TEXT,
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
                description TEXT,
                recording_url TEXT,
                whiteboard_data TEXT,
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

            CREATE TABLE IF NOT EXISTS tutor_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                bio TEXT,
                subjects TEXT,
                hourly_rate REAL,
                availability TEXT,
                education TEXT,
                experience TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            );

            CREATE TABLE IF NOT EXISTS student_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                bio TEXT,
                interests TEXT,
                education_level TEXT,
                learning_goals TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            );

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

        console.log('Database initialized');
    } catch (error) {
        console.error('Database initialization error:', error);
    }
}

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || uuidv4(); // Use environment variable or generate a random secret
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || uuidv4();
const JWT_ACCESS_EXPIRY = '15m'; // Short-lived access tokens
const JWT_REFRESH_EXPIRY = '7d'; // Longer-lived refresh tokens

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || uuidv4(),
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Configure Passport strategies
require('./passport-config')(passport);

// Make db available to routes
app.use(async (req, res, next) => {
    if (!app.locals.db) {
        app.locals.db = await open({
            filename: path.join(__dirname, 'database.sqlite'),
            driver: sqlite3.Database
        });
    }
    next();
});

// Custom CSRF protection middleware
global.csrfTokens = new Map();

function generateCsrfToken(userId) {
    const token = uuidv4();
    // Store token with expiration time (1 hour)
    global.csrfTokens.set(token, {
        userId,
        expires: Date.now() + (60 * 60 * 1000)
    });
    return token;
}

function validateCsrfToken(token, userId) {
    const tokenData = global.csrfTokens.get(token);

    // Token doesn't exist
    if (!tokenData) return false;

    // Token expired
    if (tokenData.expires < Date.now()) {
        global.csrfTokens.delete(token);
        return false;
    }

    // Token belongs to different user
    if (tokenData.userId !== userId) return false;

    return true;
}

// Clean up expired tokens periodically
setInterval(() => {
    const now = Date.now();
    for (const [token, data] of global.csrfTokens.entries()) {
        if (data.expires < now) {
            global.csrfTokens.delete(token);
        }
    }
}, 15 * 60 * 1000); // Every 15 minutes

// CSRF protection middleware
function csrfProtection(req, res, next) {
    // Skip CSRF for login/register routes and non-mutating methods
    if (req.method === 'GET' ||
        req.path === '/api/login' ||
        req.path === '/api/register' ||
        req.path === '/api/refresh-token') {
        return next();
    }

    const token = req.headers['x-csrf-token'];
    const userId = req.user?.id;

    if (!token || !userId || !validateCsrfToken(token, userId)) {
        return res.status(403).json({
            error: 'Invalid CSRF token',
            code: 'INVALID_CSRF_TOKEN'
        });
    }

    next();
}

// Authentication middleware will be defined below
// We'll apply CSRF protection after defining authenticateToken

// Authentication middleware
function authenticateToken(req, res, next) {
    // Check for token in Authorization header or secure cookie
    const authHeader = req.headers['authorization'];
    const tokenFromHeader = authHeader && authHeader.split(' ')[1];
    const tokenFromCookie = req.cookies.accessToken;

    const token = tokenFromHeader || tokenFromCookie;

    if (!token) {
        return res.status(401).json({
            error: 'Unauthorized',
            code: 'NO_TOKEN'
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({
                    error: 'Token expired',
                    code: 'TOKEN_EXPIRED'
                });
            }

            return res.status(403).json({
                error: 'Invalid token',
                code: 'INVALID_TOKEN'
            });
        }

        // Check if token is in blacklist (for logged out tokens)
        // In a real app, this would check a Redis store or database

        req.user = user;
        next();
    });
}

// Refresh token middleware
app.post('/api/refresh-token', async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({
            error: 'Refresh token required',
            code: 'NO_REFRESH_TOKEN'
        });
    }

    try {
        // Verify refresh token
        const user = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

        // Check if refresh token is in blacklist
        // In a real app, this would check a Redis store or database

        // Generate new access token
        const accessToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_ACCESS_EXPIRY }
        );

        // Set new access token in cookie
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Refresh token error:', error);
        return res.status(403).json({
            error: 'Invalid refresh token',
            code: 'INVALID_REFRESH_TOKEN'
        });
    }
});

// Now that authenticateToken is defined, apply CSRF protection to API routes
app.use('/api', csrfProtection);

// Generate CSRF token route
app.get('/api/csrf-token', authenticateToken, (req, res) => {
    const token = generateCsrfToken(req.user.id);
    res.json({ csrfToken: token });
});

// Import auth routes
const authRoutes = require('./auth-routes');

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Use auth routes
app.use('/auth', authRoutes);

// Legacy auth routes (to be removed after migration)
app.post('/api/register', authLimiter, async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Validate input
        if (!name || !email || !password || !role) {
            return res.status(400).json({
                error: 'All fields are required',
                code: 'MISSING_FIELDS'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Invalid email format',
                code: 'INVALID_EMAIL'
            });
        }

        // Validate password strength
        if (password.length < 8) {
            return res.status(400).json({
                error: 'Password must be at least 8 characters long',
                code: 'WEAK_PASSWORD'
            });
        }

        // Check for common password patterns
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
                code: 'WEAK_PASSWORD'
            });
        }

        // Check if user already exists
        const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser) {
            return res.status(400).json({
                error: 'User already exists',
                code: 'USER_EXISTS'
            });
        }

        // Hash password with strong settings
        const hashedPassword = await bcrypt.hash(password, 12); // Higher cost factor for better security

        // Insert user
        const result = await db.run(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, role]
        );

        // Generate tokens
        const accessToken = jwt.sign(
            { id: result.lastID, email, role },
            JWT_SECRET,
            { expiresIn: JWT_ACCESS_EXPIRY }
        );

        const refreshToken = jwt.sign(
            { id: result.lastID, email, role },
            JWT_REFRESH_SECRET,
            { expiresIn: JWT_REFRESH_EXPIRY }
        );

        // Set cookies
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/api/refresh-token', // Only sent to refresh token endpoint
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Generate CSRF token
        const csrfToken = uuidv4();

        // Return user data and token
        res.status(201).json({
            user: { id: result.lastID, name, email, role },
            csrfToken
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            error: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

app.post('/api/login', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                error: 'Email and password are required',
                code: 'MISSING_FIELDS'
            });
        }

        // Find user
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

        // Use constant-time comparison to prevent timing attacks
        if (!user || !(await bcrypt.compare(password, user.password))) {
            // Add a small delay to prevent user enumeration
            await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 100));

            return res.status(401).json({
                error: 'Invalid credentials',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // Generate tokens
        const accessToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_ACCESS_EXPIRY }
        );

        const refreshToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_REFRESH_SECRET,
            { expiresIn: JWT_REFRESH_EXPIRY }
        );

        // Set cookies
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/api/refresh-token', // Only sent to refresh token endpoint
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Generate CSRF token
        const csrfToken = uuidv4();

        // Return user data and token
        res.json({
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            csrfToken
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Server error',
            code: 'SERVER_ERROR'
        });
    }
});

// Logout route
app.post('/api/logout', (req, res) => {
    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken', { path: '/api/refresh-token' });

    // In a real app, you would also add the tokens to a blacklist

    res.json({ success: true });
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
