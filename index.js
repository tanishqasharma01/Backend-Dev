const express = require('express');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const mongoose = require('mongoose');

const app = express();

// ==========================================
// GLOBAL SETUP & DATABASE CONNECTION
// ==========================================
mongoose.connect('mongodb://127.0.0.1:27017/express-assignment')
    .then(() => console.log('MongoDB Connected Successfully!'))
    .catch(err => console.log('MongoDB Error:', err));

app.use(express.json()); 
app.use(cookieParser('Tani-secret-key')); 
app.use(session({
    secret: 'Tani-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24 hours
}));


// =====================================================================
// --- PDF 1: EXPRESS & MONGOOSE MIDDLEWARES EXERCISES (5 Questions) ---
// =====================================================================

// ---------------------------------------------------------
// PDF 1 - Q1: Create a Request Logging System
// ---------------------------------------------------------
const requestLogger = (req, res, next) => {
    const startTime = Date.now(); 
    const timestamp = new Date().toISOString();
    
    res.on('finish', () => {
        const logEntry = `[${timestamp}] ${req.method} ${req.url} | Status: ${res.statusCode} | Time: ${Date.now() - startTime}ms\n`;
        fs.appendFile(path.join(__dirname, 'requests.log'), logEntry, (err) => {
            if (err) console.error(err);
        });
    });
    next(); 
};
app.use(requestLogger); // Applied globally


// ---------------------------------------------------------
// PDF 1 - Q2: Implement Multi-Factor Authentication
// ---------------------------------------------------------
const mfaMiddleware = (req, res, next) => {
    const token = req.headers['authorization']; // Dummy JWT check
    const { otp } = req.body;
    
    if (!token) return res.status(401).json({ error: "JWT Token missing" });
    if (!otp || otp !== '1234') return res.status(401).json({ error: "Invalid OTP" }); // Dummy OTP = 1234
    
    next();
};
app.post('/secure-action', mfaMiddleware, (req, res) => {
    res.json({ message: "MFA Verified! Action completed." });
});


// ---------------------------------------------------------
// PDF 1 - Q3: Build a User Activity Tracker (Mongoose)
// ---------------------------------------------------------
const userActivitySchema = new mongoose.Schema({
    username: String,
    lastActive: Date,
    loginTimes: [Date]
});

// Mongoose Pre-save hook to track last active
userActivitySchema.pre('save', function(next) {
    this.lastActive = new Date();
    next();
});
const UserActivity = mongoose.model('UserActivity', userActivitySchema);

app.post('/track-login', async (req, res) => {
    const user = new UserActivity({ username: req.body.username, loginTimes: [new Date()] });
    await user.save(); // Pre-save hook will automatically add lastActive
    res.json({ message: "User activity tracked!", data: user });
});


// ---------------------------------------------------------
// PDF 1 - Q4: Create a Soft Delete System (Mongoose)
// ---------------------------------------------------------
const productSchema = new mongoose.Schema({
    name: String,
    price: Number,
    isDeleted: { type: Boolean, default: false }
});

// Pre-find Middleware: Automatically hides deleted products
productSchema.pre(/^find/, function(next) {
    this.where({ isDeleted: false });
    next();
});
const Product = mongoose.model('Product', productSchema);

app.delete('/products/:id', async (req, res) => {
    // Updating flag instead of deleting completely
    await Product.findByIdAndUpdate(req.params.id, { isDeleted: true });
    res.json({ message: "Product soft deleted!" });
});


// ---------------------------------------------------------
// PDF 1 - Q5: Build a Data Sanitization Middleware
// ---------------------------------------------------------
const sanitizeInput = (req, res, next) => {
    if (req.body) {
        for (let key in req.body) {
            if (typeof req.body[key] === 'string') {
                // Strips out potential script tags or SQL injection symbols
                req.body[key] = req.body[key].replace(/[<>$]/g, ""); 
            }
        }
    }
    next();
};
app.post('/sanitize-test', sanitizeInput, (req, res) => {
    res.json({ message: "Data sanitized!", cleanData: req.body });
});



// =====================================================================
// --- PDF 2: COOKIES & SESSIONS EXERCISES (5 Questions) ---
// =====================================================================

// ---------------------------------------------------------
// PDF 2 - Q1: Multi-Step Form with Sessions
// ---------------------------------------------------------
app.post('/form/step1', (req, res) => {
    req.session.step1 = req.body;
    res.json({ message: "Step 1 saved in session" });
});
app.post('/form/step2', (req, res) => {
    req.session.step2 = req.body;
    res.json({ message: "Step 2 saved in session" });
});
app.get('/form/submit', (req, res) => {
    const fullForm = { ...req.session.step1, ...req.session.step2 };
    req.session.step1 = null; req.session.step2 = null; // Clear after submit
    res.json({ message: "Form submitted successfully", data: fullForm });
});


// ---------------------------------------------------------
// PDF 2 - Q2: Language Preference System
// ---------------------------------------------------------
app.post('/set-language', (req, res) => {
    const { lang } = req.body;
    // Persists language in a cookie for 1 year
    res.cookie('language', lang, { maxAge: 365 * 24 * 60 * 60 * 1000 });
    res.json({ message: `Language preference saved to ${lang}` });
});
app.get('/greeting', (req, res) => {
    const lang = req.cookies.language || 'en';
    const greetings = { en: "Hello", hi: "Namaste", es: "Hola" };
    res.json({ message: greetings[lang] });
});


// ---------------------------------------------------------
// PDF 2 - Q3: Secure Admin Panel
// ---------------------------------------------------------
const checkAdmin = (req, res, next) => {
    if (req.session.role !== 'admin') {
        return res.status(403).json({ error: "Access Denied! Admin only." });
    }
    next();
};
app.post('/admin-login', (req, res) => {
    req.session.role = 'admin'; // Setting role in session
    res.json({ message: "Logged in as Admin" });
});
app.get('/admin-dashboard', checkAdmin, (req, res) => {
    res.json({ message: "Welcome to the highly secure admin panel." });
});


// ---------------------------------------------------------
// PDF 2 - Q4: Session Timeout Warning
// ---------------------------------------------------------
app.get('/check-session', (req, res) => {
    if (!req.session) return res.status(401).json({ error: "No active session" });
    
    // Check remaining time in milliseconds
    const timeRemaining = req.session.cookie.maxAge; 
    
    // Warn if less than 5 minutes (300000 ms) left
    if (timeRemaining < 300000) {
        return res.json({ warning: "Your session is about to expire!", timeRemaining });
    }
    res.json({ message: "Session is active and healthy.", timeRemaining });
});


// ---------------------------------------------------------
// PDF 2 - Q5: Anonymous vs Authenticated Cart
// ---------------------------------------------------------
app.post('/cart/add-anonymous', (req, res) => {
    const { productId } = req.body;
    let cart = req.cookies.anonymousCart ? req.cookies.anonymousCart : [];
    
    cart.push({ productId });
    res.cookie('anonymousCart', cart, { maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ message: "Added to anonymous cart (Cookie)" });
});

app.post('/login', (req, res) => {
    req.session.username = req.body.username || "tani"; // Default name
    
    // MIGRATION: Transfer from Cookie to Session
    if (req.cookies.anonymousCart) {
        req.session.cart = req.cookies.anonymousCart; 
        res.clearCookie('anonymousCart'); 
    } else {
        req.session.cart = []; 
    }
    res.json({ message: "Login successful. Cart migrated!" });
});


// ==========================================
// START SERVER
// ==========================================
app.listen(3000, () => {
    console.log('Server is running on port 3000');
    console.log('All 10 Assignment Questions are loaded and ready!');
});