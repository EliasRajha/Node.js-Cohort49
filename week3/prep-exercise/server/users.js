import newDatabase from './database.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const isPersistent = true; // Change to true for persistent storage
const database = newDatabase({ isPersistent });

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';
export const register = async (req, res) => {
    const { username, password } = req.body;

    // Validate request body
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = { username, password: hashedPassword };
        const storedUser = database.create(newUser);

        res.status(201).json({ id: storedUser.id, username: storedUser.username });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user.' });
    }
};

export const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    const user = Object.values(database).find(u => u.username === username);

    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Compare hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ token });
};

export const getProfile = (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = database.getById(decoded.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json({ username: user.username });
    } catch (error) {
        res.status(401).json({ message: 'Invalid token.' });
    }
};

export const logout = (req, res) => {
    res.status(204).send(); 
};
