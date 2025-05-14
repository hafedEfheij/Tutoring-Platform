/**
 * Passport Configuration for TutorConnect
 * Sets up authentication strategies for local, Google, and Facebook
 */

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const bcrypt = require('bcrypt');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

// Load environment variables
require('dotenv').config();

// Database connection
let db;

async function initializeDb() {
    db = await open({
        filename: path.join(__dirname, 'database.sqlite'),
        driver: sqlite3.Database
    });
}

// Initialize database connection
initializeDb();

// JWT Options
const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production'
};

// Configure Passport
module.exports = function(passport) {
    // Serialize user for session
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    // Deserialize user from session
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
            done(null, user);
        } catch (error) {
            done(error, null);
        }
    });

    // Local Strategy (username/password)
    passport.use(new LocalStrategy(
        {
            usernameField: 'email',
            passwordField: 'password'
        },
        async (email, password, done) => {
            try {
                // Find user by email
                const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

                // User not found
                if (!user) {
                    return done(null, false, { message: 'Incorrect email or password' });
                }

                // Check password
                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) {
                    return done(null, false, { message: 'Incorrect email or password' });
                }

                // Success
                return done(null, user);
            } catch (error) {
                return done(error);
            }
        }
    ));

    // Google OAuth Strategy - only if credentials are provided
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        passport.use(new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL,
                scope: ['profile', 'email']
            },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Check if user already exists
                let user = await db.get('SELECT * FROM users WHERE google_id = ?', [profile.id]);

                // If user exists, return the user
                if (user) {
                    return done(null, user);
                }

                // Check if email already exists
                const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
                if (email) {
                    user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

                    if (user) {
                        // Update existing user with Google ID
                        await db.run(
                            'UPDATE users SET google_id = ?, profile_picture = ? WHERE id = ?',
                            [profile.id, profile.photos[0]?.value || null, user.id]
                        );

                        // Get updated user
                        user = await db.get('SELECT * FROM users WHERE id = ?', [user.id]);
                        return done(null, user);
                    }
                }

                // Create new user
                const result = await db.run(
                    'INSERT INTO users (name, email, password, role, google_id, profile_picture, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [
                        profile.displayName,
                        email,
                        '', // No password for OAuth users
                        'student', // Default role
                        profile.id,
                        profile.photos[0]?.value || null,
                        new Date().toISOString()
                    ]
                );

                // Get the newly created user
                const newUser = await db.get('SELECT * FROM users WHERE id = ?', [result.lastID]);

                // Create default student profile
                await db.run(
                    'INSERT INTO student_profiles (user_id, bio, interests) VALUES (?, ?, ?)',
                    [newUser.id, '', JSON.stringify([])]
                );

                return done(null, newUser);
            } catch (error) {
                return done(error);
            }
        }
        ));
    }

    // Facebook OAuth Strategy - only if credentials are provided
    if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
        passport.use(new FacebookStrategy(
            {
                clientID: process.env.FACEBOOK_APP_ID,
                clientSecret: process.env.FACEBOOK_APP_SECRET,
                callbackURL: process.env.FACEBOOK_CALLBACK_URL,
                profileFields: ['id', 'displayName', 'photos', 'email']
            },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Check if user already exists
                let user = await db.get('SELECT * FROM users WHERE facebook_id = ?', [profile.id]);

                // If user exists, return the user
                if (user) {
                    return done(null, user);
                }

                // Check if email already exists
                const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
                if (email) {
                    user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

                    if (user) {
                        // Update existing user with Facebook ID
                        await db.run(
                            'UPDATE users SET facebook_id = ?, profile_picture = ? WHERE id = ?',
                            [profile.id, profile.photos[0]?.value || null, user.id]
                        );

                        // Get updated user
                        user = await db.get('SELECT * FROM users WHERE id = ?', [user.id]);
                        return done(null, user);
                    }
                }

                // Create new user
                const result = await db.run(
                    'INSERT INTO users (name, email, password, role, facebook_id, profile_picture, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [
                        profile.displayName,
                        email,
                        '', // No password for OAuth users
                        'student', // Default role
                        profile.id,
                        profile.photos[0]?.value || null,
                        new Date().toISOString()
                    ]
                );

                // Get the newly created user
                const newUser = await db.get('SELECT * FROM users WHERE id = ?', [result.lastID]);

                // Create default student profile
                await db.run(
                    'INSERT INTO student_profiles (user_id, bio, interests) VALUES (?, ?, ?)',
                    [newUser.id, '', JSON.stringify([])]
                );

                return done(null, newUser);
            } catch (error) {
                return done(error);
            }
        }
        ));
    }

    // JWT Strategy
    passport.use(new JwtStrategy(jwtOptions, async (jwt_payload, done) => {
        try {
            const user = await db.get('SELECT * FROM users WHERE id = ?', [jwt_payload.id]);

            if (user) {
                return done(null, user);
            } else {
                return done(null, false);
            }
        } catch (error) {
            return done(error, false);
        }
    }));
};
