const Database = require('better-sqlite3');
const path = require('path');

// Netlify 환경에서 DB 파일 경로 수정 (배포 시에는 /tmp, 로컬에서는 ./DB)
const dbPath = process.env.NODE_ENV === 'production' ? '/tmp/raffle.db' : './DB/raffle.db';  // 배포 시에는 /tmp 사용

const db = new Database(dbPath, { verbose: console.log });


// 테이블 생성 (동기식으로 실행)
db.prepare(`
  CREATE TABLE IF NOT EXISTS participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
  )
`).run();

// Netlify Function (API 엔드포인트)
exports.handler = async (event, context) => {
    if (event.httpMethod === 'GET') {
        // 참가자 수 조회
        const row = db.prepare('SELECT COUNT(*) AS count FROM participants').get();
        return {
            statusCode: 200,
            body: JSON.stringify(row),
        };
    }

    if (event.httpMethod === 'POST') {
        // 새 참가자 추가
        const { name } = JSON.parse(event.body);
        if (!name) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Name is required' }),
            };
        }

        const stmt = db.prepare('INSERT INTO participants (name) VALUES (?)');
        stmt.run(name);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: `${name} added successfully` }),
        };
    }
};
