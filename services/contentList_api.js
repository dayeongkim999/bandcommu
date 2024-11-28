const loginApi = require('./login_api');
const axios = require("axios");

const contentListApi = {
    getContentListUrl: function (access_token, band_key) {
        const contentListUrl = loginApi.POST_LIST_URL +
        '?access_token=' + encodeURIComponent(access_token) +
        '&band_key=' + encodeURIComponent(band_key) +
        '&locale=ko_KR';
        const options = {
            url: contentListUrl,
            headers: { Authorization: 'Bearer ' + access_token } // Bearer 토큰 설정
        };
        return options;
    },
    getContentPagingUrl: function (next_params){
        const contentPagingUrl = loginApi.POST_LIST_URL + '?after=' + next_params.after + '&limit=' + next_params.limit + '&access_token=' + next_params.access_token + "&band_key=" + next_params.band_key;
        const options = {
            url: contentPagingUrl,
            headers: { Authorization: 'Bearer ' + next_params.access_token } // Bearer 토큰 설정
        };
        return options;
    },
    getContentList: async function(access_token, band_key){
        const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000; // 48시간(초)
        const now = Date.now();
        let recentPosts = [];
        let nextParams = null;
        try {
            const options = this.getContentListUrl(access_token, band_key);
            console.log(options);
            let response = await axios(options);
            let result_code = response.data.result_code;
            const body = response.data.result_data;
            
            if (result_code !== 1) {
                console.log('Naver band content list get error');
                return { redirect: "/?resultCd=L" }; // 실패 시 리다이렉트 경로 반환
            }

            // 현재 페이지 데이터 필터링
            let items = body.items.filter(item => now - item.created_at <= TWO_DAYS_MS);
            recentPosts = recentPosts.concat(items);
    
            // 페이징 정보 추출
            nextParams = body.paging.next_params || null;

            // 페이징 처리 루프
            while (nextParams) {
                if (!nextParams.limit) {
                    console.log('Invalid nextParams:', nextParams);
                    break; // nextParams가 유효하지 않으면 루프 종료
                }

                const pagingOptions = this.getContentPagingUrl(nextParams);
                response = await axios(pagingOptions);

                ({ result_code, result_data } = response.data);

                if (result_code !== 1) {
                    console.log('Naver band content list get error during paging');
                    break;
                }

                // 다음 페이지 데이터 필터링
                items = result_data.items.filter(item => now - item.created_at <= TWO_DAYS_MS);
                recentPosts = recentPosts.concat(items);

                // 다음 페이징 정보 업데이트
                nextParams = result_data.paging.next_params;
            }
            return recentPosts; // 최근 2일 이내의 글 목록 반환
        } catch (error) {
            if (error.response) {
                console.log('Cannot fetch band content list : ' + error.response.status);
            } else {
                console.log('Error:', error.message);
            }
            console.error(error);
            return null; // 에러 발생 시 null 반환
        }
    }
}

module.exports = contentListApi;