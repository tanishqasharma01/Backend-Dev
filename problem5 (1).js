const express = require('express'); //
const passport = require('passport'); //
const LocalStrategy = require('passport-local').Strategy; //
const JwtStrategy = require('passport-jwt').Strategy; //
const ExtractJwt = require('passport-jwt').ExtractJwt;
const jwt = require('jsonwebtoken');
const session = require('express-session');

const app = express(); //
app.use(express.json());

// Session setup required for Local Strategy
app.use(session({
    secret: 'my-passport-session-secret',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

const JWT_SECRET = 'my-super-secret-jwt-key';

// Mock Database
const users = [
    { id: 1, username: 'adit', password: 'password123', email: 'adit@example.com' }
];

// Passport Serialization (For Session Auth)
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
    const user = users.find(u => u.id === id);
    done(null, user);
});

// TODO: Configure Local Strategy
passport.use('local', new LocalStrategy(
    { usernameField: 'username', passwordField: 'password' },
    (username, password, done) => {
        const user = users.find(u => u.username === username);
        if (!user) return done(null, false, { message: 'User not found' });
        if (user.password !== password) return done(null, false, { message: 'Incorrect password' });
        
        return done(null, user); // Success
    }
)); //

// TODO: Configure JWT Strategy
passport.use('jwt', new JwtStrategy(
    {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: JWT_SECRET
    },
    (jwtPayload, done) => {
        const user = users.find(u => u.id === jwtPayload.id);
        if (user) return done(null, user); // Success
        return done(null, false);
    }
)); //

// ---------------- ROUTES ----------------

// TODO: Implement Session Login
app.post('/auth/login', passport.authenticate('local'), (req, res) => {
    res.json({ message: 'Session Login successful! Cookie set.', user: req.user });
}); //

// TODO: Implement API login (returns JWT)
app.post('/auth/api-login', (req, res, next) => { //
    passport.authenticate('local', { session: false }, (err, user, info) => {
        if (err || !user) return res.status(401).json({ error: info?.message || 'Login failed' });
        
        // Generate JWT Token
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ message: 'API Login successful! Use this token for API routes.', token });
    })(req, res, next);
}); //

// Helper Middleware for Session Route
const isSessionAuth = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ error: 'Session not found. Please use /auth/login first.' });
};

// TODO: Protected route with session auth
app.get('/dashboard', isSessionAuth, (req, res) => { //
    res.json({ message: 'Welcome to your Session Dashboard', user: req.user });
}); //

// TODO: Protected route with JWT auth
app.get('/api/profile', passport.authenticate('jwt', { session: false }), (req, res) => { //
    res.json({ message: 'Welcome to your API Profile', user: req.user });
}); //

app.listen(3000, () => { //
    console.log("Passport Server running on port 3000");
});