const loginApi = require('./login_api');
const findNoticesInPosts = require('./postParser');
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
    getContentPagingUrl: function (next_params) {
        const contentPagingUrl = loginApi.POST_LIST_URL + '?after=' + next_params.after + '&limit=' + next_params.limit + '&access_token=' + next_params.access_token + "&band_key=" + next_params.band_key;
        const options = {
            url: contentPagingUrl,
            headers: { Authorization: 'Bearer ' + next_params.access_token } // Bearer 토큰 설정
        };
        return options;
    },
    getNoticeList: async function (access_token, band_key, day=2) {
        const TWO_DAYS_MS = day * 24 * 60 * 60 * 1000; // 48시간(초)
        const now = Date.now();
        let recentPosts = [];
        let nextParams = null;
        try {
            const options = this.getContentListUrl(access_token, band_key);
            let response = await axios(options);
            let result_code = response.data.result_code;
            const body = response.data.result_data;

            if (result_code !== 1) {
                console.log('Naver band content list get error');
                return { redirect: "/?resultCd=L" }; // 실패 시 리다이렉트 경로 반환
            }

            // 현재 페이지 데이터 이틀 이내 것만 필터링
            let items = body.items.filter(item => now - item.created_at <= TWO_DAYS_MS);

            // 만약 데이터가 이틀 이상 지난 글로만 구성되어 있다면 종료
            if (items.length === 0) {
                console.log("No posts within the last 2 days. Exiting.");
                return recentPosts; // 빈 배열 반환
            }

            // '#공지' 태그를 포함한 글만 필터링
            let noticeItems = await findNoticesInPosts(items);
            recentPosts = recentPosts.concat(noticeItems);

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
                let items = result_data.items.filter(item => now - item.created_at <= TWO_DAYS_MS);

                // 만약 데이터가 이틀 이상 지난 글로만 구성되어 있다면 루프 종료
                if (items.length === 0) {
                    console.log("No more posts within the last 2 days. Breaking loop.");
                    break;
                }

                // '#공지' 태그를 포함한 글만 필터링
                let noticeItems = await findNoticesInPosts(items);
                recentPosts = recentPosts.concat(noticeItems);

                // 다음 페이징 정보 업데이트
                nextParams = result_data.paging.next_params || null;
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
    },
    //단발성 글 불러오기, 테스트용
    getOneContentList: async function (access_token, band_key){
        try {
            const options = this.getContentListUrl(access_token, band_key);
            let response = await axios(options);
            let result_code = response.data.result_code;
            const body = response.data.result_data;

            if (result_code !== 1) {
                console.log('Naver band content list get error');
                return { redirect: "/?resultCd=L" }; // 실패 시 리다이렉트 경로 반환
            }

            return body.items; // 최근 2일 이내의 글 목록 반환
        } catch (error) {
            if (error.response) {
                console.log('Cannot fetch band content list : ' + error.response.status);
            } else {
                console.log('Error:', error.message);
            }
            console.error(error);
            return null; // 에러 발생 시 null 반환
        }
    },
    //모든 컨텐트를 가져오는 list. api 호출 제한이 걸리니 무한 루프는 쓰지 말것
    getContentList: async function (access_token, band_key, date) {
        const TWO_DAYS_MS = date * 24 * 60 * 60 * 1000; // date일
        const now = Date.now();
        let recentPosts = [];
        let nextParams = null;
        try {
            const options = this.getContentListUrl(access_token, band_key);
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
            // 이 부분 처리 필요
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