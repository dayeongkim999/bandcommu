const loginApi = require('./login_api');
const axios = require("axios");

const profileApi = {
    getProfileUrl: async function (access_token) {
        const profileUrl = loginApi.PROFILE_URL + '?access_token=' + access_token;
        const options = {
            url: profileUrl,
            headers: { Authorization: 'Bearer ' + access_token } // Bearer 토큰 설정
        };
        try {
            const response = await axios(options);
            const result_code = response.data.result_code;
            const body = response.data.result_data;
            
            if (result_code !== 1) {
                console.log('Naver profile get error');
                console.log('Unexpected result_code:', result_code);
                console.log('Full response:', response);
            return;
            }

            return body; // 성공 시 데이터 반환
        } catch (error) {
            if (error.response) {
                console.log('Cannot fetch profile : ' + error.response.status);
            } else {
                console.log('Error:', error.message);
            }
            console.error(error);
            return null; // 에러 발생 시 null 반환
        }
    },
    getBandProfileUrl: async function (access_token, band_key) {
        const profileUrl = loginApi.PROFILE_URL + '?access_token=' + access_token + '&band_key=' + band_key;
        const options = {
            url: profileUrl,
            headers: { Authorization: 'Bearer ' + access_token } // Bearer 토큰 설정
        };
        try {
            const response = await axios(options);
            const result_code = response.data.result_code;
            const body = response.data.result_data;
            
            if (result_code !== 1) {
                console.log('Naver profile get error, band: ' + band_key);
                console.log('Unexpected result_code:', result_code);
                console.log('Full response:', response);
            return;
            }

            return body; // 성공 시 데이터 반환
        } catch (error) {
            if (error.response) {
                console.log('Cannot fetch profile : ' + error.response.status);
            } else {
                console.log('Error:', error.message);
            }
            console.error(error);
            return null; // 에러 발생 시 null 반환
        }
    },
}

module.exports = profileApi;