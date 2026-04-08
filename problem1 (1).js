const express = require('express'); // [cite: 1707]
const bcrypt = require('bcrypt'); // [cite: 1708]

const app = express(); // [cite: 1709]
app.use(express.json()); // [cite: 1710]

// Simulated database
const users = []; // [cite: 1711]

// TODO 1: Implement password validation function 
function validatePassword(password) {
    const errors = [];
    
    // Check minimum length (8 chars) [cite: 1700]
    if (password.length < 8) {
        errors.push("Password must be at least 8 characters");
    }
    
    // Check uppercase, lowercase, numbers, and special characters using Regex 
    if (!/[A-Z]/.test(password)) errors.push("Must contain at least one uppercase letter");
    if (!/[a-z]/.test(password)) errors.push("Must contain at least one lowercase letter");
    if (!/\d/.test(password)) errors.push("Must contain at least one number");
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push("Must contain at least one special character");

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// TODO 2: Implement registration endpoint [cite: 1715]
app.post('/register', async (req, res) => { // [cite: 1716]
    try {
        const { username, email, password } = req.body;

        // 1. Basic validation check
        if (!username || !email || !password) {
            return res.status(400).json({ error: "Username, email, and password are required" });
        }

        // 2. Validate Password Strength [cite: 1700, 1701]
        const passwordCheck = validatePassword(password);
        if (!passwordCheck.isValid) {
            return res.status(400).json({ 
                error: "Password does not meet requirements", 
                details: passwordCheck.errors 
            }); // [cite: 1705]
        }

        // 3. Prevent duplicate registrations [cite: 1704]
        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
            return res.status(409).json({ error: "User with this email already exists" }); // [cite: 1743]
        }

        // 4. Hash password using bcrypt 
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds); // 

        // 5. Store user in database [cite: 1703]
        const newUser = {
            id: users.length + 1,
            username: username,
            email: email,
            password: hashedPassword
        };
        users.push(newUser);

        // 6. Return success message without exposing the password [cite: 1705, 1727]
        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Registration failed due to server error" }); // [cite: 1705]
    }
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
}); // [cite: 1719]