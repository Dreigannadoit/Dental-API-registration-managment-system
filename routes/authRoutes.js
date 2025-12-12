const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

console.log('=== AUTH ROUTES LOADED ===');
console.log('Admin username from .env:', process.env.ADMIN_USERNAME);
console.log('Admin password from .env:', process.env.ADMIN_PASSWORD);

// Patient Registration
router.post('/register', async (req, res) => {
    console.log('=== REGISTER REQUEST ===');
    console.log('Body:', req.body);

    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                error: 'Missing required fields'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(400).json({
                error: 'User with this email or username already exists'
            });
        }

        // Create new user
        const user = new User({
            username,
            email,
            password,
            role: 'patient'
        });

        await user.save();
        console.log('User saved:', user.username);

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Registration successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Registration error:', error.message);
        res.status(500).json({
            error: 'Registration failed',
            details: error.message
        });
    }
});

// Login
router.post('/login', async (req, res) => {
    console.log('=== LOGIN REQUEST ===');
    console.log('Body:', req.body);

    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                error: 'Username and password are required'
            });
        }

        // Check for admin credentials from .env
        const adminUsername = process.env.ADMIN_USERNAME || 'admin';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin12345';

        console.log('Checking admin login...');
        console.log('Input username:', username);
        console.log('Admin username:', adminUsername);
        console.log('Input password:', password);
        console.log('Admin password:', adminPassword);

        if (username === adminUsername && password === adminPassword) {
            console.log('✅ Admin credentials matched!');

            // Check if admin user exists in database, create if not
            let adminUser = await User.findOne({ username: adminUsername });

            if (!adminUser) {
                console.log('Creating admin user...');
                adminUser = new User({
                    username: adminUsername,
                    email: 'admin@dentalclinic.com',
                    password: adminPassword,
                    role: 'admin'
                });
                await adminUser.save();
                console.log('Admin user created:', adminUser._id);
            }

            const token = jwt.sign(
                { userId: adminUser._id, role: 'admin' },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            return res.json({
                message: 'Admin login successful',
                token,
                user: {
                    id: adminUser._id,
                    username: adminUser.username,
                    role: 'admin'
                },
                isAdmin: true
            });
        }

        console.log('Not admin, checking regular user...');
        // Regular user login
        const user = await User.findOne({
            $or: [{ email: username }, { username }]
        });

        if (!user) {
            console.log('❌ User not found');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Compare password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            console.log('❌ Invalid password');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log('✅ User login successful:', user.username);
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            },
            isAdmin: user.role === 'admin'
        });
    } catch (error) {
        console.error('Login error:', error.message);
        console.error('Full error:', error);
        res.status(500).json({
            error: 'Login failed',
            details: error.message
        });
    }
});

// Verify token
router.get('/verify', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ valid: false });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ valid: false });
        }

        res.json({
            valid: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(401).json({ valid: false });
    }
});

module.exports = router;