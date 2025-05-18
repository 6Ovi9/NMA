# Gamified Educational Web App

This project is a lightweight web app for Raspberry Pi 3B and similar devices. It features:
- User registration and login (with hashed passwords)
- QR code unlocking for skill nodes
- Visual skill tree (Skyrim constellation style) using HTML/JS (D3.js or SVG)
- Node.js + Express backend with SQLite

## Folders
- `public/` — Frontend assets (HTML, JS, CSS)
- `routes/` — Express route handlers
- `models/` — Database models
- `controllers/` — Business logic

## Setup
1. Clone this repo
2. Run `npm install`
3. Start server: `node index.js`

## Usage
- Access the app in your browser at `http://localhost:3000`
- Register/login, scan QR codes (via URL), and unlock skills!

---

Replace this README as you develop your project.
