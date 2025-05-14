/**
 * Authentication Routes for TutorConnect
 * Handles local, Google, and Facebook authentication
 */

const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

// Load environment variables
require('dotenv').config();

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_ACCESS_EXPIRY = '15m';
const JWT_REFRESH_EXPIRY = '7d';

// Custom CSRF token generation
function generateCsrfToken(userId) {
    const token = uuidv4();
    // Store token with expiration time (1 hour)
    global.csrfTokens.set(token, {
        userId,
        expires: Date.now() + (60 * 60 * 1000)
    });
    return token;
}

// Local Authentication Routes
router.post('/register', async (req, res, next) => {
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
        const existingUser = await req.app.locals.db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser) {
            return res.status(400).json({
                error: 'User already exists',
                code: 'USER_EXISTS'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Insert user
        const result = await req.app.locals.db.run(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, role]
        );

        // Create profile based on role
        if (role === 'tutor') {
            await req.app.locals.db.run(
                'INSERT INTO tutor_profiles (user_id, bio, subjects, hourly_rate, availability) VALUES (?, ?, ?, ?, ?)',
                [result.lastID, '', JSON.stringify([]), 0, '']
            );
        } else {
            await req.app.locals.db.run(
                'INSERT INTO student_profiles (user_id, bio, interests) VALUES (?, ?, ?)',
                [result.lastID, '', JSON.stringify([])]
            );
        }

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
        const csrfToken = generateCsrfToken(result.lastID);

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

router.post('/login', (req, res, next) => {
    passport.authenticate('local', { session: false }, (err, user, info) => {
        if (err) {
            return res.status(500).json({ error: 'Server error', code: 'SERVER_ERROR' });
        }

        if (!user) {
            return res.status(401).json({ error: info.message || 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
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
        const csrfToken = generateCsrfToken(user.id);

        // Return user data and token
        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                profile_picture: user.profile_picture
            },
            csrfToken
        });
    })(req, res, next);
});

// Google OAuth Routes - only if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    router.get('/google',
        passport.authenticate('google', { scope: ['profile', 'email'] })
    );

    router.get('/google/callback',
        passport.authenticate('google', { failureRedirect: '/login', session: false }),
        (req, res) => {
        // Generate tokens
        const accessToken = jwt.sign(
            { id: req.user.id, email: req.user.email, role: req.user.role },
            JWT_SECRET,
            { expiresIn: JWT_ACCESS_EXPIRY }
        );

        const refreshToken = jwt.sign(
            { id: req.user.id, email: req.user.email, role: req.user.role },
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

        // Redirect to frontend with token
        res.redirect(`${process.env.FRONTEND_URL}/oauth-success?token=${accessToken}`);
    });
}

// Facebook OAuth Routes - only if credentials are provided
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    router.get('/facebook',
        passport.authenticate('facebook', { scope: ['email'] })
    );

    router.get('/facebook/callback',
        passport.authenticate('facebook', { failureRedirect: '/login', session: false }),
        (req, res) => {
        // Generate tokens
        const accessToken = jwt.sign(
            { id: req.user.id, email: req.user.email, role: req.user.role },
            JWT_SECRET,
            { expiresIn: JWT_ACCESS_EXPIRY }
        );

        const refreshToken = jwt.sign(
            { id: req.user.id, email: req.user.email, role: req.user.role },
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

        // Redirect to frontend with token
        res.redirect(`${process.env.FRONTEND_URL}/oauth-success?token=${accessToken}`);
    });
}

// Logout route
router.post('/logout', (req, res) => {
    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken', { path: '/api/refresh-token' });

    // In a real app, you would also add the tokens to a blacklist

    res.json({ success: true });
});

// Refresh token route
router.post('/refresh-token', async (req, res) => {
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

        // Generate new CSRF token
        const csrfToken = generateCsrfToken(user.id);

        res.json({ success: true, csrfToken });
    } catch (error) {
        console.error('Refresh token error:', error);
        return res.status(403).json({
            error: 'Invalid refresh token',
            code: 'INVALID_REFRESH_TOKEN'
        });
    }
});

module.exports = router;
