const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;

// Netlify 환경에서 DB 파일 경로 수정 (배포 시에는 /tmp 사용)
const dbPath = process.env.DB_PATH || '/tmp/raffle.db'; // Netlify 환경 변수 사용

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// 테이블 생성 (동기식으로 실행)
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

// 참가자 수 조회 (GET)
app.get('/count', (req, res) => {
    db.get('SELECT COUNT(*) AS count FROM participants', (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(row);
    });
});

// 새 참가자 추가 (POST)
app.post('/add', (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }

    const stmt = db.prepare('INSERT INTO participants (name) VALUES (?)');
    stmt.run(name, function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ message: `${name} added successfully`, id: this.lastID });
    });
});

// 랜덤 참가자 추첨 (GET)
app.get('/draw', (req, res) => {
    db.get('SELECT name FROM participants ORDER BY RANDOM() LIMIT 1', (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(row || { name: 'No participants yet' });
    });
});

// 데이터베이스 리셋 (POST)
app.post('/reset', (req, res) => {
    db.run('DELETE FROM participants', (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ message: 'Database reset successful' });
    });
});

// 서버 시작
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
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


// 참가자 추가 (apply 경로 처리)
app.post('/apply', (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }

    const stmt = db.prepare('INSERT INTO participants (name) VALUES (?)');
    stmt.run(name, function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ message: `${name}님이 응모되었습니다!`, id: this.lastID });
    });
});
