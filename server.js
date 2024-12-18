import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const app = express();
const port = 3000;

// ES 모듈에서는 __dirname이 없으므로 설정 필요
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// SQLite 데이터베이스 설정
const db = new sqlite3.Database('./db/raffle.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the raffle database.');
});

// 테이블 생성
db.run(`CREATE TABLE IF NOT EXISTS participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
)`);

// 참가자 이름 추가
app.post('/add', (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    db.run(`INSERT INTO participants (name) VALUES (?)`, [name], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, name });
    });
});

// 참가자 수 조회
app.get('/count', (req, res) => {
    db.get(`SELECT COUNT(*) AS count FROM participants`, (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row);
    });
});

// 랜덤 참가자 추첨
app.get('/draw', (req, res) => {
    db.get(`SELECT name FROM participants ORDER BY RANDOM() LIMIT 1`, (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row || { name: 'No participants' });
    });
});

// 데이터베이스 리셋
app.post('/reset', (req, res) => {
    db.run(`DELETE FROM participants`, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Database reset successful' });
    });
});

// 서버 실행
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// 새로운 신청 엔드포인트
app.post('/apply', (req, res) => {
    const { name } = req.body;

    if (!name) return res.status(400).json({ error: 'Name is required' });

    db.run(`INSERT INTO participants (name) VALUES (?)`, [name], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: `${name} has successfully applied!`, id: this.lastID });
    });
});


// 새로운 신청 페이지 서빙
app.get('/apply', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'apply.html'));
});