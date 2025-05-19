// User model and SQLite setup
const sqlite3 = require('sqlite3').verbose();
const bcryptjs = require('bcryptjs');
const path = require('path');

// Create database in the project root
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'goonersliar.db');
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

        // Create admin account with all skills unlocked if not exists
        const allSkills = ['sciences', 'humanities', 'languages', 'technology'];
        db.get('SELECT * FROM users WHERE username = ?', ['admin'], (err, user) => {
            if (err) {
                console.error('Error checking admin user:', err);
                return;
            }
            if (!user) {
                const hash = bcryptjs.hashSync('admin', 10);
                db.run(
                    'INSERT INTO users (username, password, unlocked_skills) VALUES (?, ?, ?)',
                    ['admin', hash, JSON.stringify(allSkills)],
                    function(err) {
                        if (err) {
                            console.error('Error creating admin user:', err);
                            return;
                        }
                        console.log('Admin account created with ID:', this.lastID);
                        console.log('Admin skills initialized:', allSkills);
                    }
                );
            } else {
                // Always ensure admin has all skills unlocked
                db.run(
                    'UPDATE users SET unlocked_skills = ? WHERE username = ?',
                    [JSON.stringify(allSkills), 'admin'],
                    (err) => {
                        if (err) {
                            console.error('Error updating admin skills:', err);
                            return;
                        }
                        console.log('Admin skills updated:', allSkills);
                    }
                );
            }
        });
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
