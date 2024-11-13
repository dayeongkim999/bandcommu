const loginApi = require('./login_api');
const axios = require("axios");

const bandListApi = {
    getBandListUrl: async function (access_token) {
        const bandListUrl = loginApi.BAND_LIST_URL + '?access_token=' + access_token;
        try {
            const response = await axios(bandListUrl);
            const result_code = response.data.result_code;
            const body = response.data.result_data;
            
            if (result_code !== 1) {
                console.log('Naver band list get error');
                return { redirect: "/?resultCd=L" }; // 실패 시 리다이렉트 경로 반환
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