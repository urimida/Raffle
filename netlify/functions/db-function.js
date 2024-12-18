const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;

// DB 경로 설정
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

// 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 참가자 수 조회
app.get('/count', (req, res) => {
    db.get('SELECT COUNT(*) AS count FROM participants', (err, row) => {
        if (err) {
            console.error('Error fetching count:', err.message); // 에러 로그 추가
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(row);
    });
});

// 새 참가자 추가
app.post('/add', (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }

    const stmt = db.prepare('INSERT INTO participants (name) VALUES (?)');
    stmt.run(name, function (err) {
        if (err) {
            console.error('Error inserting participant:', err.message); // 에러 로그 추가
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ message: `${name} added successfully`, id: this.lastID });
    });
});

// 랜덤 참가자 추첨
app.get('/draw', (req, res) => {
    db.get('SELECT name FROM participants ORDER BY RANDOM() LIMIT 1', (err, row) => {
        if (err) {
            console.error('Error drawing winner:', err.message); // 에러 로그 추가
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(row || { name: 'No participants yet' });
    });
});

// 데이터베이스 리셋
app.post('/reset', (req, res) => {
    db.run('DELETE FROM participants', (err) => {
        if (err) {
            console.error('Error resetting database:', err.message); // 에러 로그 추가
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ message: 'Database reset successful' });
    });
});

// 서버 시작
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// Netlify Functions 내보내기
exports.handler = async (event, context) => {
    return new Promise((resolve, reject) => {
        const handler = app(event, context, (error, response) => {
            if (error) {
                console.error('Error in function handler:', error); // 함수 핸들러에서 에러 로그 추가
                reject(error);
            }
            resolve(response);
        });
    });
};
