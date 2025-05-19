// User model and SQLite setup
const sqlite3 = require('sqlite3').verbose();
const bcryptjs = require('bcryptjs');
const path = require('path');

// Create database in the project root
const dbPath = path.join(__dirname, '..', 'goonersliar.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
        return;
    }
    console.log('Connected to database:', dbPath);
});

// Initialize database schema
db.serialize(() => {
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');

    // Create users table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        unlocked_skills TEXT DEFAULT '[]'
    )`, (err) => {
        if (err) {
            console.error('Error creating users table:', err);
            return;
        }
        console.log('Users table ready');
        
    });
});

// Handle cleanup on process exit
process.on('exit', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        }
    });
});

module.exports = db;
