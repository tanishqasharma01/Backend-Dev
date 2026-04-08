const express = require('express'); // [cite: 1923]
const bcrypt = require('bcrypt'); // [cite: 1924]

const app = express(); // [cite: 1925]
app.use(express.json()); // [cite: 1926]

const users = []; // [cite: 1927]
const loginAttempts = new Map(); // email -> { count, lockUntil } // [cite: 1928]

// Testing ke liye ek dummy user bana rahe hain
const setupMockUser = async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    users.push({ email: 'test@example.com', password: hashedPassword });
};
setupMockUser();

// 1. Check login attempts // [cite: 1929]
function checkLoginAttempts(email) { // [cite: 1930]
    const record = loginAttempts.get(email);
    if (!record) return { allowed: true };

    // Agar account locked hai aur time abhi baaki hai
    if (record.lockUntil && record.lockUntil > Date.now()) {
        const remainingMinutes = Math.ceil((record.lockUntil - Date.now()) / 60000);
        return { allowed: false, message: `Account locked. Try again in ${remainingMinutes} minutes.` };
    }

    // Agar lock time khatam ho gaya hai, toh purana record delete kar do
    if (record.lockUntil && record.lockUntil <= Date.now()) {
        loginAttempts.delete(email);
        return { allowed: true };
    }

    return { allowed: true };
}

// 2. Record failed attempt // [cite: 1933]
function recordFailedAttempt(email) { // [cite: 1934]
    const record = loginAttempts.get(email) || { count: 0, lockUntil: null };
    record.count += 1;

    // 5 galat attempts ke baad 30 minutes (1800000 ms) ke liye lock kar do
    if (record.count >= 5) {
        record.lockUntil = Date.now() + 30 * 60 * 1000; 
    }

    loginAttempts.set(email, record);
    return record;
}

// 3. Clear attempts (Success hone par) // [cite: 1937]
function clearAttempts(email) { // [cite: 1937]
    loginAttempts.delete(email);
}

// 4. Login API with rate limiting // [cite: 1940]
app.post('/login', async (req, res) => { // [cite: 1941]
    const { email, password } = req.body;

    // Step 1: Check agar account already locked toh nahi hai
    const attemptStatus = checkLoginAttempts(email);
    if (!attemptStatus.allowed) {
        return res.status(429).json({ error: attemptStatus.message });
    }

    // Step 2: User dhundho
    const user = users.find(u => u.email === email);
    if (!user) {
        recordFailedAttempt(email);
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Step 3: Password verify karo
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
        const record = recordFailedAttempt(email);
        if (record.lockUntil) {
             return res.status(429).json({ error: 'Account locked due to 5 failed attempts. Try again in 30 minutes.' });
        }
        const remaining = 5 - record.count;
        return res.status(401).json({ error: `Invalid credentials. ${remaining} attempts remaining.` });
    }

    // Step 4: Login successful - purane sabhi failed attempts clear kar do
    clearAttempts(email);
    res.json({ message: 'Login successful! Welcome back.' });
}); // [cite: 1942]

app.listen(3000, () => { // [cite: 1944]
    console.log('Rate-Limit Server running on port 3000');
});