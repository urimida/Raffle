# Node.js 공식 이미지 사용
FROM node:20

# 작업 디렉토리 설정
WORKDIR /app

# 의존성 설치
COPY package*.json ./
RUN npm install --build-from-source sqlite3

# 애플리케이션 코드 복사
COPY . .

# 서버 실행
CMD ["node", "server.js"]