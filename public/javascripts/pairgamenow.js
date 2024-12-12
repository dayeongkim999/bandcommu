  // AJAX로 찌름 현황 데이터 로드
  function loadPairGameStatus() {
    $.ajax({
        url: `/api/pairgame/data/${postKey}`, // 서버에서 데이터 가져오는 API
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            const pairGameList = $('#pairgame-list');
            pairGameList.empty(); // 기존 데이터를 비움
            data.forEach((item, index) => {
                pairGameList.append(`<div data-index="${index}" class="list-group-item">
                    <div>${new Date(item.updatedAt).toLocaleString()}</div>
                    <div>${item.user_name} -> ${item.opponent_name}</div>
                    </div>`);
            });
        },
        error: function(err) {
            console.error('Error loading pairgame status:', err);
        }
    });
}

// 5초마다 찌름 업데이트
setInterval(loadPairGameStatus(), 1000);

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

function updateDeadlineTime() {
    $.ajax({
        url: '/api/pairgame/deadline', // 마감 시간을 반환하는 API
        method: 'GET',
        success: function(data) {
            const deadlineElement = document.getElementById('deadline-time');
            if (data.expires_at) {
                const deadline = new Date(data.expires_at).toLocaleString();
                deadlineElement.textContent = deadline;
            } else {
                deadlineElement.textContent = '정보 없음';
            }
        },
        error: function(err) {
            console.error('Error fetching deadline time:', err);
        }
    });
}

// 페이지 로드 시 마감 시간 업데이트
updateDeadlineTime();
