async function registerUser(event) {
    event.preventDefault(); // 폼 기본 동작 방지

    // 폼 데이터 가져오기
    const nickname = document.getElementById("floatingTextarea").value;

    try {
        // AJAX 요청 보내기
        const response = await fetch("/login/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ nickname }),
        });

        const data = await response.json();

        if (data.success) {
            // 인증 코드 팝업 표시
            alert(`Your authentication code is: ${data.authentication}`);
            
            // 유저 목록에 새 유저 추가
            const userList = document.querySelector(".userList ul");
            const newUserItem = document.createElement("li");
            newUserItem.innerHTML = `
                <strong>ID:</strong> ${data._id} |
                <strong>Nickname:</strong> ${data.user.nickname} |
                <strong>Verified:</strong> ${data.user.isVerified ? "Yes" : "No"}
                <strong>Last Access:</strong> ${data.user.lastAccess}
                <form action="/login/users/${data._id}?_method=DELETE" method="POST" style="display:inline;" onsubmit="return confirm('정말로 삭제하시겠습니까?');">
                    <button type="submit" class="btn btn-danger btn-lg">삭제</button>
                </form>
            `;
            userList.appendChild(newUserItem);

            // 폼 초기화
            document.getElementById("floatingTextarea").value = "";            
        } else {
            alert("Failed to register user: " + data.message);
        }
    } catch (error) {
        console.error("Error:", error);
        alert("An error occurred while registering user.");
    }
}

document.getElementById("registerForm").addEventListener("submit", registerUser, { once: true });


async function deleteUser(event, userId) {
    event.preventDefault(); // 기본 폼 동작 방지

    try {
        // AJAX 요청 보내기
        const response = await fetch(`/login/users/${userId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
        });

        const data = await response.json();

        if (data.success) {
            // 성공 시 DOM에서 해당 요소 삭제
            const userElement = document.getElementById(`user-${userId}`);
            if (userElement) {
                userElement.remove();
            }
            alert(data.message); // 성공 메시지 출력
        } else {
            alert("Failed to delete user: " + data.message);
        }
    } catch (error) {
        console.error("Error deleting user:", error);
        alert("An error occurred while deleting the user.");
    }
}
