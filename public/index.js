// 응모자 이름 추가
async function apply() {
    const name = document.getElementById('nameInput').value.trim();
    if (!name) {
        alert('이름을 입력해주세요!');
        return;
    }

    try {
        const response = await fetch('/api/apply', {  // 수정된 API 경로
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });

        if (response.ok) {
            const result = await response.json();
            document.getElementById('message').innerText = result.message || '응모에 실패했습니다.';
            document.getElementById('nameInput').value = '';
        } else {
            // 응답이 실패했을 때
            const errorData = await response.json();
            alert(errorData.error || '응모에 실패했습니다.');
        }
    } catch (error) {
        console.error('Request failed', error);
        alert('서버와의 연결에 문제가 발생했습니다.');
    }
}
// 참가자 수 조회
async function getCount() {
    const response = await fetch('/api/count');  // 수정된 경로
    const data = await response.json();
    document.getElementById('participantCount').innerText = data.count;
}

// 랜덤 추첨
async function drawWinner() {
    const response = await fetch('/api/draw');  // 수정된 경로
    const data = await response.json();
    document.getElementById('winnerDisplay').innerText = `당첨자: ${data.name}`;
}

// 리셋
async function resetRaffle() {
    if (confirm('모든 데이터를 삭제하시겠습니까?')) {
        const response = await fetch('/api/reset', { method: 'POST' });  // 수정된 경로
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
