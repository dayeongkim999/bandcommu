const loginApi = require('./login_api');
const findNoticesInPosts = require('./postParser');
const axios = require("axios");

const writePostApi = {
    postWritePostUrl: function (access_token, band_key, content) {
        const writePostUrl = loginApi.POST_CREATE_URL +
            '?access_token=' + encodeURIComponent(access_token) +
            '&band_key=' + encodeURIComponent(band_key)+
            '&content=' + encodeURIComponent(content);
        const options = {
            url: writePostUrl,
            headers: { Authorization: 'Bearer ' + access_token },
            method: "POST", // Bearer 토큰 설정
        };
        return options;
    },
    writePost: async function (access_token, band_key, content){
        try{
            //요청 보내기
            const options = this.postWritePostUrl(access_token, band_key, content);
            let response = await axios(options);
            let result_code = response.data.result_code;
            const body = response.data.result_data;

            if (result_code !== 1) {
                console.log('Naver band content list get error');
                return { redirect: "/?resultCd=L" }; // 실패 시 리다이렉트 경로 반환
            }
        }
        catch(error) {
            if (error.response) {
                console.log('Cannot write band content : ' + error.response.status);
            } else {
                console.log('Error:', error.message);
            }
            console.error(error);
            return null; // 에러 발생 시 null 반환
        }
    }
}

module.exports = writePostApi;