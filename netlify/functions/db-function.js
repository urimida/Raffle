const express = require('express');
const serverless = require('serverless-http');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const dbPath = '/tmp/raffle.db';
const fs = require('fs');

if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, '');
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Error opening database:', err.message);
    else console.log('Connected to database.');
});

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS participants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        )
    `);
});

app.get('/api/count', (req, res) => {
    db.get('SELECT COUNT(*) AS count FROM participants', (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row);
    });
});

app.post('/api/apply', (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const stmt = db.prepare('INSERT INTO participants (name) VALUES (?)');
    stmt.run(name, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: `${name} added successfully`, id: this.lastID });
    });
});

app.get('/api/draw', (req, res) => {
    db.get('SELECT name FROM participants ORDER BY RANDOM() LIMIT 1', (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row || { name: 'No participants yet' });
    });
});

module.exports.handler = serverless(app);
