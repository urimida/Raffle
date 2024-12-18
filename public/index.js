// 응모자 이름 추가
async function addParticipant() {
    const name = document.getElementById('nameInput').value.trim();
    if (!name) {
        alert('이름을 입력해주세요.');
        return;
    }

    const response = await fetch('/.netlify/functions/db-function', {  // 수정된 경로
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    });

    if (response.ok) {
        alert(`${name}님이 응모되었습니다!`);
        getCount();
    } else {
        alert('응모에 실패했습니다.');
    }

    document.getElementById('nameInput').value = '';
}

// 참가자 수 조회
async function getCount() {
    const response = await fetch('/.netlify/functions/db-function');  // 수정된 경로
    const data = await response.json();
    document.getElementById('participantCount').innerText = data.count;
}

// 랜덤 추첨
async function drawWinner() {
    const response = await fetch('/.netlify/functions/db-function');  // 수정된 경로
    const data = await response.json();
    document.getElementById('winnerDisplay').innerText = `당첨자: ${data.name}`;
}

// 리셋
async function resetRaffle() {
    if (confirm('모든 데이터를 삭제하시겠습니까?')) {
        const response = await fetch('/.netlify/functions/db-function', { method: 'POST' });  // 수정된 경로
        if (response.ok) {
            alert('리셋이 완료되었습니다.');
            getCount();
            document.getElementById('winnerDisplay').innerText = '';
        } else {
            alert('리셋에 실패했습니다.');
        }
    }
}

// 초기 참가자 수 조회
getCount();
