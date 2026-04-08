const express = require('express'); // [cite: 1788]
const session = require('express-session'); // [cite: 1789]

const app = express(); // [cite: 1790]
app.use(express.json()); // [cite: 1791]

app.use(session({
    secret: 'auth-secret', // [cite: 1793]
    resave: false, // [cite: 1794]
    saveUninitialized: false // [cite: 1795]
})); // [cite: 1796]

// Simulated databases with Roles
const users = [ // [cite: 1797]
    { id: 1, username: 'normal_user', role: 'user' },
    { id: 2, username: 'mod_user', role: 'moderator' },
    { id: 3, username: 'admin_user', role: 'admin' }
];
const posts = []; // [cite: 1798]

// Dummy Login Route (To set the session for testing)
app.post('/login', (req, res) => {
    const { username } = req.body;
    const user = users.find(u => u.username === username);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    req.session.userId = user.id; // Save user in session
    res.json({ message: `Logged in as ${user.role}`, user });
});

// TODO: Implement authentication middleware
const isAuthenticated = (req, res, next) => { // [cite: 1799]
    if (req.session.userId) {
        // Find user and attach to request
        req.user = users.find(u => u.id === req.session.userId);
        return next();
    }
    res.status(401).json({ error: 'Authentication required. Please login first.' });
}; // [cite: 1803]

// TODO: Implement role-based authorization middleware
const requireRole = (...allowedRoles) => { 
    return (req, res, next) => {
        // Admin has all permissions automatically, or check if user's role is in the allowed list
        if (req.user && (req.user.role === 'admin' || allowedRoles.includes(req.user.role))) {
            return next();
        }
        res.status(403).json({ error: 'Insufficient permissions to perform this action' });
    };
}; // [cite: 1808]

// TODO: Implement resource ownership check
const isOwnerOrModerator = (req, res, next) => { // [cite: 1810]
    const postId = parseInt(req.params.id);
    const post = posts.find(p => p.id === postId);
    
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // Allow if user is admin, moderator, OR the actual owner of the post
    if (req.user.role === 'admin' || req.user.role === 'moderator' || post.authorId === req.user.id) {
        req.post = post; // Pass the found post to the next function
        return next();
    }
    
    res.status(403).json({ error: 'You can only modify your own posts' });
}; // [cite: 1812]

// TODO: Implement routes
// 1. Create a post (Any authenticated user can create)
app.post('/posts', isAuthenticated, (req, res) => { // [cite: 1816]
    const newPost = {
        id: posts.length + 1,
        title: req.body.title,
        content: req.body.content,
        authorId: req.user.id
    };
    posts.push(newPost);
    res.status(201).json({ message: 'Post created successfully', post: newPost });
}); // [cite: 1818]

// 2. Update a post (Only Owner, Moderator, or Admin)
app.put('/posts/:id', isAuthenticated, isOwnerOrModerator, (req, res) => { // [cite: 1820]
    req.post.title = req.body.title || req.post.title;
    req.post.content = req.body.content || req.post.content;
    
    res.json({ message: 'Post updated successfully', post: req.post });
}); // [cite: 1823]

// 3. Delete a post (Only Moderator or Admin)
app.delete('/posts/:id', isAuthenticated, requireRole('moderator'), (req, res) => { // [cite: 1824]
    const postId = parseInt(req.params.id);
    const index = posts.findIndex(p => p.id === postId);
    
    if (index !== -1) {
        posts.splice(index, 1);
        res.json({ message: 'Post deleted permanently' });
    } else {
        res.status(404).json({ error: 'Post not found' });
    }
}); // [cite: 1828]

app.listen(3000, () => {
    console.log("Auth Server running on port 3000");
}); // [cite: 1829]