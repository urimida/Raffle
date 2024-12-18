const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');  // CORS 패키지 불러오기
const app = express();

// DB 경로 설정 (배포 시에는 /tmp 사용, 로컬에서는 ./DB/raffle.db)
const dbPath = process.env.DB_PATH || '/tmp/raffle.db';
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// 테이블 생성
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS participants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        )
    `);
});

// CORS 미들웨어 설정 (모든 출처에서 오는 요청을 허용)
app.use(cors());  // CORS 허용을 위한 미들웨어 추가
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 참가자 수 조회
app.get('/api/count', (req, res) => {
    db.get('SELECT COUNT(*) AS count FROM participants', (err, row) => {
        if (err) {
            console.error('Error fetching count:', err.message);
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(row);
    });
});

// 새 참가자 추가
app.post('/api/add', (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }

    const stmt = db.prepare('INSERT INTO participants (name) VALUES (?)');
    stmt.run(name, function (err) {
        if (err) {
            console.error('Error inserting participant:', err.message);
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ message: `${name} added successfully`, id: this.lastID });
    });
});

// 랜덤 참가자 추첨
app.get('/api/draw', (req, res) => {
    db.get('SELECT name FROM participants ORDER BY RANDOM() LIMIT 1', (err, row) => {
        if (err) {
            console.error('Error drawing winner:', err.message);
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(row || { name: 'No participants yet' });
    });
});

// 데이터베이스 리셋
app.post('/api/reset', (req, res) => {
    db.run('DELETE FROM participants', (err) => {
        if (err) {
            console.error('Error resetting database:', err.message);
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ message: 'Database reset successful' });
    });
});

// Netlify Functions 내보내기
exports.handler = async (event, context) => {
    return new Promise((resolve, reject) => {
        app(event, context, (error, response) => {
            if (error) {
                console.error('Error in function handler:', error);
                reject(error);
            }
            resolve(response);
        });
    });
};
