const express = require('express'); //
const jwt = require('jsonwebtoken'); //

const app = express(); //
app.use(express.json()); //

const ACCESS_SECRET = 'super-secret-access-key'; //
const REFRESH_SECRET = 'super-secret-refresh-key'; //

const users = []; //
const refreshTokens = new Set(); // To store valid refresh tokens

// 1. Generate Access Token (Short lived - 15 minutes)
function generateAccessToken(user) { //
    return jwt.sign({ id: user.id, email: user.email }, ACCESS_SECRET, { expiresIn: '15m' }); //
}

// 2. Generate Refresh Token (Long lived - 7 days)
function generateRefreshToken(user) { //
    const token = jwt.sign({ id: user.id, email: user.email }, REFRESH_SECRET, { expiresIn: '7d' }); //
    refreshTokens.add(token);
    return token;
}

// 3. Login Endpoint (Returns both tokens)
app.post('/login', async (req, res) => { //
    const { email, password } = req.body;
    
    // Auto-create user for testing purposes if they don't exist
    let user = users.find(u => u.email === email);
    if (!user) {
        user = { id: users.length + 1, email, password };
        users.push(user);
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({ message: "Login Successful", accessToken, refreshToken }); //
}); //

// 4. Token Refresh Endpoint
app.post('/token/refresh', (req, res) => { //
    const { token } = req.body;
    
    if (!token || !refreshTokens.has(token)) {
        return res.status(403).json({ error: 'Invalid or missing refresh token' }); //
    }

    jwt.verify(token, REFRESH_SECRET, (err, user) => { //
        if (err) return res.status(403).json({ error: 'Token expired or invalid' });
        
        // Generate a new access token
        const newAccessToken = generateAccessToken({ id: user.id, email: user.email });
        res.json({ accessToken: newAccessToken });
    });
}); //

// 5. Protected Route Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format is "Bearer <token>"

    if (!token) return res.status(401).json({ error: 'Access token required' });

    jwt.verify(token, ACCESS_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired access token' });
        req.user = user;
        next();
    });
};

// Test Protected Route
app.get('/protected', authenticateToken, (req, res) => { //
    res.json({ message: 'Welcome to the protected route!', user: req.user }); //
}); //

// 6. Logout (Invalidates refresh token)
app.post('/logout', (req, res) => { //
    const { token } = req.body;
    refreshTokens.delete(token); // Remove token from Set
    res.json({ message: 'Logged out successfully' }); //
}); //

app.listen(3000, () => {
    console.log('JWT Server running on port 3000');
});