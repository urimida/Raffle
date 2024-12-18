import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Database from 'better-sqlite3'; // better-sqlite3 사용

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

// SQLite 데이터베이스 설정 (better-sqlite3 사용)
const db = new Database('./db/raffle.db', { verbose: console.log }); // 더 간단하게 DB 설정

// 테이블 생성 (동기식으로 실행)
db.prepare(`
  CREATE TABLE IF NOT EXISTS participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
  )
`).run();

// 참가자 이름 추가 (동기식)
app.post('/add', (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    try {
        const stmt = db.prepare('INSERT INTO participants (name) VALUES (?)');
        const info = stmt.run(name); // 동기식으로 실행
        res.json({ id: info.lastInsertRowid, name });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 참가자 수 조회 (동기식)
app.get('/count', (req, res) => {
    try {
        const row = db.prepare('SELECT COUNT(*) AS count FROM participants').get();
        res.json(row);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 랜덤 참가자 추첨 (동기식)
app.get('/draw', (req, res) => {
    try {
        const row = db.prepare('SELECT name FROM participants ORDER BY RANDOM() LIMIT 1').get();
        res.json(row || { name: 'No participants yet' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 데이터베이스 리셋 (동기식)
app.post('/reset', (req, res) => {
    try {
        db.prepare('DELETE FROM participants').run(); // 동기식으로 실행
        res.json({ message: 'Database reset successful' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 서버 실행
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// 새로운 신청 엔드포인트 (동기식)
app.post('/apply', (req, res) => {
    const { name } = req.body;

    if (!name) return res.status(400).json({ error: 'Name is required' });

    try {
        const stmt = db.prepare('INSERT INTO participants (name) VALUES (?)');
        const info = stmt.run(name); // 동기식으로 실행
        res.json({ message: `${name} has successfully applied!`, id: info.lastInsertRowid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 새로운 신청 페이지 서빙
app.get('/apply', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'apply.html'));
});
