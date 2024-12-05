const loginApi = require('./login_api');
const findTagInPosts = require('./postParser');
const findNoticesInPosts = require('./postParser');
const axios = require("axios");

const commentListApi = {
    getCommentListUrl: function (access_token, band_key, post_key) {
        const contentListUrl = loginApi.COMMENT_LIST_URL +
            '?access_token=' + encodeURIComponent(access_token) +
            '&band_key=' + encodeURIComponent(band_key) +
            '&post_key' + encodeURIComponent(post_key);
        const options = {
            url: contentListUrl,
            headers: { Authorization: 'Bearer ' + access_token } // Bearer 토큰 설정
        };
        return options;
    },
    getCommentPagingUrl: function (next_params) {
        const contentPagingUrl = loginApi.POST_LIST_URL + '?after=' + next_params.after + '&limit=' + next_params.limit + '&access_token=' + next_params.access_token + "&band_key=" + next_params.band_key;
        const options = {
            url: contentPagingUrl,
            headers: { Authorization: 'Bearer ' + next_params.access_token } // Bearer 토큰 설정
        };
        return options;
    },
    getCommentAuthorList: async function (access_token, band_key) {
        let commentAuthors = [];
        let nextParams = null;
        try {
            //요청 보내고 받기
            const options = this.getContentListUrl(access_token, band_key);
            let response = await axios(options);
            let result_code = response.data.result_code;
            const body = response.data.result_data;

            if (result_code !== 1) {
                console.log('Naver band content list get error');
                return { redirect: "/?resultCd=L" }; // 실패 시 리다이렉트 경로 반환
            }

            // 댓글 목록 순회하며 본문 첫 줄에 #홀수참여, #홀수제외, #마감이 있는지 확인
            let oddAddItems = await findTagInPosts(body.items, '#홀수참여');
            let oddMinusItems = await findTagInPosts(body.items, '#홀수제외');
            let deadLineItem = await findTagInPosts(body.items, '#마감');

            // 리스트에 추가
            commentAuthors = commentAuthors.concat(body.items);

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


                // 리스트에 추가
                commentAuthors = commentAuthors.concat(result_data.items);

                // 댓글 목록 순회하며 본문 첫 줄에 #홀수참여, #홀수제외, #마감이 있는지 확인
                oddAddItems = oddAddItems.concat(await findTagInPosts(result_data.items, '#홀수참여'));
                oddMinusItems = oddMinusItems.concat(await findTagInPosts(result_data.items, '#홀수제외'));
                deadLineItem = deadLineItem.concat(await findTagInPosts(result_data.items, '#마감'));

                // 다음 페이징 정보 업데이트
                nextParams = result_data.paging.next_params || null;
            }

            //마감 글 제외
            commentAuthors = commentAuthors.filter(author => !deadlineItem.includes(author));

            //이후 홀수라면
            if (commentAuthors.length % 2 == 1) {
                //홀수 참여 인원 확인
                let count = oddAddItems.length;
                //홀수 참여 인원이 홀수라면 전원 참가
                if (count % 2 == 1) {
                    commentAuthors = commentAuthors.filter(author => !oddAddItems.includes(author));
                }
                else if (count > 0) { //짝수면서 1명 이상이라면 제일 마지막 인원 제외 참가
                    // oddAddItems의 첫 번째 값 가져오기 (마지막 인원)
                    const lastPerson = oddAddItems[0];
                    // commentAuthors에서 lastPerson을 제외
                    commentAuthors = commentAuthors.concat(oddAddItems)
                    commentAuthors = commentAuthors.filter(author => author !== lastPerson);
                }
            }

            //그럼에도 여전히 홀수라면
            if (commentAuthors.length % 2 == 1) {
                //홀수 제외-가장 먼저 단 1명 제외
                if(oddMinusItems.length > 0){
                    // oddMinusItems의 첫 번째 값 가져오기 (마지막 인원)
                    const lastPerson = oddMinusItems[oddMinusItems.length-1];
                    // commentAuthors에서 lastPerson을 제외
                    commentAuthors = commentAuthors.filter(author => author !== lastPerson);
                }
            }

            return commentAuthors; // 최근 2일 이내의 글 목록 반환
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

}

module.exports = commentListApi;