document.addEventListener('DOMContentLoaded', function(){

    document.getElementById('authForm').addEventListener('submit', async function (e) {
        e.preventDefault(); // 기본 동작 막기
        
        const nickname = document.querySelector('[name="nickname"]').value.trim();
        const authCode = document.querySelector('[name="authcode"]').value.trim();
        
        if (!nickname) {
            alert('이름을 입력해주세요.');
            return;                                                                                                                    
        }
    
        try {
            // 서버로 전송
            const response = await fetch('/login/auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ nickname, authCode }),
            });
            const result = await response.json();
            if (result.success) {
                window.location.href = result.redirectUrl; // Band 로그인 URL로 이동
            } else {
                // 서버에서 전달된 리다이렉트 URL로 이동
                window.location.href = result.redirectUrl;}
    
        } catch (error) {
            console.error('Error:', error);
            alert('오류가 발생했습니다.');
        }
    });
});