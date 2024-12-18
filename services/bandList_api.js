const loginApi = require('./login_api');
const axios = require("axios");

const bandListApi = {
    getBandListUrl: async function (access_token) {
        const bandListUrl = loginApi.BAND_LIST_URL + '?access_token=' + access_token;
        const options = {
            url: bandListUrl,
            headers: { Authorization: 'Bearer ' + access_token } // Bearer 토큰 설정
        };
        try {
            const response = await axios(options);
            const result_code = response.data.result_code;
            const body = response.data.result_data;
            
            if (result_code !== 1) {
                console.log('Naver band list get error');
                console.log('Unexpected result_code:', result_code);
                console.log('Full response:', response);
            return;
            }
    
            return body; // 성공 시 데이터 반환
        } catch (error) {
            if (error.response) {
                console.log('Cannot fetch Naver band list : ' + error.response.status);
            } else {
                console.log('Error:', error.message);
            }
            console.error(error);
            return null; // 에러 발생 시 null 반환
        }
    },
}

module.exports = bandListApi;