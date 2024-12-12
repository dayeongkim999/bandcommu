const waitForSession = (req, timeout = 5000) => {
    return new Promise((resolve, reject) => {
        const interval = 50; // 50ms 간격으로 체크
        let elapsed = 0;

        const checkSession = () => {
            if (req.session) {
                resolve(); // 세션이 준비되면 resolve
            } else if (elapsed >= timeout) {
                reject(new Error("Session initialization timed out"));
            } else {
                elapsed += interval;
                setTimeout(checkSession, interval);
            }
        };

        checkSession();
    });
};

module.exports = waitForSession;