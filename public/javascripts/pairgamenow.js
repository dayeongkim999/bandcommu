document.addEventListener('DOMContentLoaded', function(){

// AJAX로 찌름 현황 데이터 로드
function loadPairGameStatus() {
    $.ajax({
        url: `/api/pairgame/data/${postKey}`, // 서버에서 데이터 가져오는 API
        method: 'GET',
        dataType: 'json',
        success: function (data) {
            const pairGameList = $('#pairgame-list');
            pairGameList.empty(); // 기존 데이터를 비움
            data.forEach((item, index) => {
                pairGameList.append(`<div data-index="${index}" class="list-group-item">
                    <div>${new Date(item.updatedAt).toLocaleString()}</div>
                    <div>${item.user_name} -> ${item.opponent_name}</div>
                    </div>`);
            });
        },
        error: function (err) {
            console.error('Error loading pairgame status:', err);
        }
    });
}

// 5초마다 찌름 업데이트
setInterval(loadPairGameStatus, 5000);

// 페이지 로드 시 초기 데이터 로드
loadPairGameStatus();

// 현재 시각 업데이트 함수
function updateCurrentTime() {
    const currentTimeElement = document.getElementById("current-time");
    if (currentTimeElement) {
        const now = new Date();
        currentTimeElement.textContent = now.toLocaleString(); // 현재 시각을 로컬 시간 형식으로 표시
    }
}

// 1초마다 현재 시각 업데이트
setInterval(updateCurrentTime, 1000);

// 페이지 로드 시 즉시 현재 시각 표시
updateCurrentTime();

let accessRestrictedAt = null; // 외부에서 사용할 변수 선언

function updateDeadlineTime() {
    $.ajax({
        url: '/api/pairgame/deadline', // 마감 시간을 반환하는 API
        method: 'GET',
        success: function (data) {
            accessRestrictedAt = new Date(data.access_restricted_at); // 데이터를 외부 변수에 저장
            const deadlineElement = document.getElementById('deadline-time');
            if (data.access_restricted_at) {
                const deadline = new Date(data.access_restricted_at).toLocaleString();
                deadlineElement.textContent = deadline;
            } else {
                deadlineElement.textContent = '정보 없음';
            }
        },
        error: function (err) {
            console.error('Error fetching deadline time:', err);
        }
    });
}

// 페이지 로드 시 마감 시간 업데이트
updateDeadlineTime();

const button = document.getElementById('access-button');

function checkAccessTime() {
    const now = new Date();
    if (now >= accessRestrictedAt) {
        button.disabled = false;
        button.textContent = '결과 확인 후 글 작성하기';
    } else {
        button.disabled = true;
        button.textContent = '찌름 마감 시간 후 결과 확인 가능';
    }
}

// 초기 상태 확인
checkAccessTime();

// 매 1초마다 버튼 상태 업데이트
setInterval(checkAccessTime, 1000);

// 버튼 클릭 이벤트 처리
button.addEventListener('click', async () => {
    try {
        const response = await fetch('/api/pairgame/checkdeadline');
        const data = await response.json();

        if (response.ok) {
            // 서버 측에서 data.result에 완료 페이지 링크를 담아준 상황을 가정
            if (data.status === 'success') {
                // 기한 만료 시 완료 페이지로 이동
                window.location.href = data.result; 
            } else {
                // 아직 기한이 남았다면 경고 표시
                alert(data.message + ': ' + data.result);
            }
        } else {
            // 서버 응답이 OK가 아닌 경우(에러 상황)
            alert(data.message);
        }
    } catch (error) {
        console.error('Error fetching access:', error);
    }
});
});