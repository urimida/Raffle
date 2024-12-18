const express = require('express');
const Database = require('better-sqlite3');
const app = express();
const port = 3000;

// DB 경로 설정 (배포 시 /tmp 사용, 로컬 개발 시에는 ./DB/raffle.db)
const dbPath = process.env.NODE_ENV === 'production' ? '/tmp/raffle.db' : './DB/raffle.db';
const db = new Database(dbPath, { verbose: console.log });

// 테이블 생성 (동기식으로 실행)
db.prepare(`
  CREATE TABLE IF NOT EXISTS participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
  )
`).run();

// 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 참가자 수 조회 (GET)
app.get('/count', (req, res) => {
    try {
        const row = db.prepare('SELECT COUNT(*) AS count FROM participants').get();
        res.status(200).json(row);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 새 참가자 추가 (POST)
app.post('/add', (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }

    try {
        const stmt = db.prepare('INSERT INTO participants (name) VALUES (?)');
        stmt.run(name);
        res.status(200).json({ message: `${name} added successfully` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 랜덤 참가자 추첨 (GET)
app.get('/draw', (req, res) => {
    try {
        const row = db.prepare('SELECT name FROM participants ORDER BY RANDOM() LIMIT 1').get();
        res.status(200).json(row || { name: 'No participants yet' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 데이터베이스 리셋 (POST)
app.post('/reset', (req, res) => {
    try {
        db.prepare('DELETE FROM participants').run();
        res.status(200).json({ message: 'Database reset successful' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Netlify에서 Express를 사용하려면 서버를 함수로 내보내기
exports.handler = async (event, context) => {
    return new Promise((resolve, reject) => {
        const handler = app(event, context, (error, response) => {
            if (error) {
                reject(error);
            }
            resolve(response);
        });
    });
};
