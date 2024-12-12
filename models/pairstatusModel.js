const mongoose = require('mongoose');
const commentListApi = require('../services/commentList_api');
const findTagInPosts = require('../services/postParser');

const pairStatusSchema = new mongoose.Schema({
    band_key: { type: String, required: true }, //밴드 키
    post_key: { type: String, required: true }, // 게시글 키
    user_name: { type: String, required: true }, // 사용자 이름: 화면 표시용
    user_key: { type: String, required: true }, //사용자 키: 찌름 정리용
    opponent_name: { type: String, required: true }, //찌른 상대 이름: 화면 표시용
    opponent_key: { type: String, required: true } //상대 키: 찌름 정리용
}, { timestamps: true });

const PairStatus = mongoose.model('PairStatus', pairStatusSchema);

//찌름 생성
async function createPair(band_key, post_key, user_name, user_key, opponent_name, opponent_key) {
    try {
        const result = await PairStatus.create({ band_key, post_key, user_name, user_key, opponent_name, opponent_key });
        console.log('Pairstatus inserted:', result);
        return result;
    }
    catch (error) {
        console.error('Error inserting Pairstatus:', error);
    }
}

//찌름 업데이트
async function updatePair(band_key, post_key, user_name, user_key, opponent_name, opponent_key) {
    try {
        const result = await PairStatus.updateOne(
            { user_key, band_key, post_key }, //수정 대상
            { $set: { opponent_name, opponent_key } } // 어느 레코드를 업데이트 할지 조건 지정
        );

        if (result.matchedCount === 0) {
            console.log('No matching records found to update.');
            return null;
        }

        if (result.modifiedCount === 0) {
            console.log('Record matched but not modified (no changes were needed).');
            return 0;
        }

        const pair = await PairStatus.findOne({ user_key, band_key, post_key }); // 단일 문서 반환
        console.log('PairStatus updated successfully.');
        return pair; // 업데이트된 정보 반환
    }
    catch (error) {
        console.error('Error updating Pairstatus:', error);
    }
}


// 찌른 순으로 모든 목록 불러오기
async function getPairsInEarlyOrder(post_key) {
    try {
        // find()로 모든 문서 가져오고, sort()로 updatedAt 오름차순 정렬
        const pairs = await PairStatus.find({ post_key: post_key }).sort({ updatedAt: 1 }); // 1은 오름차순(이른 순)
        return pairs;
    } catch (error) {
        console.error('Error fetching pairs in early order:', error);
    }
}

// user_key로 데이터 찾기
async function findPair(user_key) {
    try {
        const pair = await PairStatus.find({ user_key });

        if (!pair || pair.length === 0) {
            console.log(`No pairs found for user_key: ${user_key}`);
        }

        return pair;
    }
    catch (error) {
        console.error('Error fetching pair by user id:', error);
    }
}

//자찌름 찾기
async function findSelfPairs(post_key) {
    try {
        //자찌름 페어 찾기
        const pairs = await PairStatus.find({
            post_key,
            $expr: { $eq: ["$user_key", "$opponent_key"] }
        });
        
        if (!pairs || pairs.length === 0) {
            console.log(`No self pair`);
        }

        return pairs;
    }
    catch (error) {
        console.error('Error fetching self pair by user id:', error);
    }
}

//자찌름 제외 페어 목록 불러오기
async function getPairsExcludedSelfPairs(post_key) {
    try {
        // find()로 모든 문서 가져오고, sort()로 updatedAt 오름차순 정렬
        let pairs = await PairStatus.find({ post_key: post_key }).sort({ updatedAt: 1 }); // 1은 오름차순(이른 순)
        // 자찌름 페어 가져오기
        const selfPairs = await findSelfPairs(post_key);

        // 자찌름 페어가 있으면 pairs에서 제외
        if (selfPairs.length > 0) {
            pairs = pairs.filter(p => {
                // selfPairs 중 p와 같은 _id를 가진 항목이 있는지 확인
                return !selfPairs.some(sp => p._id.toString() === sp._id.toString());
            });
        }
        return pairs;
    } catch (error) {
        console.error('Error fetching pairs excluded self pairs:', error);
    }
}

//맞찌름 찾기
async function findMutualPairs(post_key) {
    try {
        //자찌름 제외 찌름 목록 불러오기
        const pairs = await getPairsExcludedSelfPairs(post_key);

        if (!pairs || pairs.length === 0) {
            console.log(`No pairs`);
            return;
        }

        //맞찌름 찾기
        //Map 생성
        const pairMap = new Map();
        for (const p of pairs) {
            const key = `${p.user_key}|${p.opponent_key}`;
            pairMap.set(key, p);
        }

        let matches = [];
        let visited = new Set();

        // pairs 순회하며 반대 문서가 있는지 확인
        for (const p of pairs) {
            const reverseKey = `${p.opponent_key}|${p.user_key}`;

            if (pairMap.has(reverseKey) && !visited.has(reverseKey)) {
                // p와 pairMap.get(reverseKey)가 쌍을 이룬다.
                const matchedDoc = pairMap.get(reverseKey);

                // matches에 추가
                matches.push([p, matchedDoc]);

                // 중복 처리를 피하기 위해 visited에 등록
                visited.add(`${p.user_key}|${p.opponent_key}`);
                visited.add(`${matchedDoc.user_key}|${matchedDoc.opponent_key}`);
            }
        }

        return matches;
    } catch (error) {
        console.error('Error fetching mutual pairs:', error);
    }
}

//맞찌름 제외 페어 목록 불러오기
async function getPairsExcludedMutualPairs(post_key) {
    try {
        //자찌름 제외 찌름 목록 불러오기
        let pairs = await getPairsExcludedSelfPairs(post_key);

        if (!pairs || pairs.length === 0) {
            console.log(`No pairs`);
            return;
        }

        // 맞찌름 페어 가져오기
        const mutualPairs = await findMutualPairs(post_key);
        if (mutualPairs && mutualPairs.length > 0) {
            mutualPairs.forEach(pair => {
                const a = pair[0]; // 첫 번째 요소
                const b = pair[1]; // 두 번째 요소

                // pairs에서 a와 b의 _id를 제외
                pairs = pairs.filter(p => p._id.toString() !== a._id.toString());
                pairs = pairs.filter(p => p._id.toString() !== b._id.toString());
            });
        }

        return pairs;

    } catch (error) {
        console.error('Error fetching pairs excluded mutual pairs:', error);
    }
}

//매칭 가능한 선찌름 찾기
async function findOnesidedPairs(post_key) {
    try {
        //자찌름 제외 맞찌름 제외 찌름 목록 불러오기
        let pairs = await getPairsExcludedMutualPairs(post_key);
        if(!pairs) return [];
        //updatedAt으로 오름차순으로 정렬
        pairs.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));

        //자찌름, 맞찌름 페어 불러오기
        const selfPairs = await findSelfPairs(post_key);
        const mutualPairs = await findMutualPairs(post_key);
        let pairsKey = [];
        // selfPairs와 mutualPairs의 각 요소를 순회하면서 opponent_key를 pairsKey에 추가
        selfPairs.forEach(pair => {
            pairsKey.push(pair.opponent_key);
        });
        mutualPairs.forEach(pair => {
            pairsKey.push(pair[0].opponent_key);
            pairsKey.push(pair[1].opponent_key);
        })

        let successId = [];
        pairs.forEach(pair => {
            //실패: 자찌름으로 이미 짝 존재
            //실패: 맞찌름으로 이미 짝 존재
            //실패: 다른 사람이 먼저 찔러서 이미 짝 존재
            let possible = true;
            for (const existKey of pairsKey) {
                if (pair.opponent_key === existKey) {
                    // 누군가와 이미 짝이 지어졌다면
                    // 찌름 불가 목록에 넣음
                    possible = false;
                    forbiddenId.push(pair._id.toString());
                    break; // 반복 종료
                }
            }
            if (possible) {
                //짝이 없는 상대라면
                //유저와 상대 키를 이미 짝이 맺어진 pairsKey에 추가
                pairsKey.push(pair.user_key);
                pairsKey.push(pair.opponent_key);
                successId.push(pair._id.toString());
            }

        })
        // 선찌름 된 페어 목록 반환
        // forbiddenId 배열에 포함된 _id들을 제외한 pairs 배열 생성
        pairs = pairs.filter(pair => successId.includes(pair._id.toString()));
        return pairs;
    } catch (error) {
        console.error('Error finding one sided pairs:', error);
    }
}

async function checkParticipate(checkPairs, participants) {
    try {
        if (!Array.isArray(checkPairs) || checkPairs.length === 0) {
            return []; // checkPairs가 비어있거나 배열이 아닌 경우 빈 배열 반환
        }

        const participantKeys = new Set(participants.map(p => p.author.user_key));
        if (Array.isArray(checkPairs[0])) {
            // checkPairs가 2차원 배열인 경우
            return checkPairs.filter(subArray =>
                subArray.every(pair => participantKeys.has(pair.user_key))
            );
        } else {
            // checkPairs가 1차원 배열인 경우
            return checkPairs.filter(pair => {
                return participantKeys.has(pair.user_key) && participantKeys.has(pair.opponent_key)});
        }
    }
    catch (error) {
        console.error('Error check pairs for participants list', error);
    }
}

//랜덤 페어 생성
async function createRandomPairs(participants) {
    let shuffled = [...participants].sort(() => Math.random() - 0.5); // 참가자 랜덤 섞기
    let pairs = [];

    while (shuffled.length > 1) {
        // 두 명씩 짝지어 페어 생성
        const pair = [shuffled.pop(), shuffled.pop()];
        pairs.push(pair);
    }

    return pairs;
}

//자찌름 맞찌름 선찌름 랜덤 매칭 페어 목록 통합해 반환
async function makeFinalPairs(access_token, band_key, post_key) {
    try {
        //전체 데이터 불러오기
        let participants = await commentListApi.getAllParticipants(access_token, band_key, post_key);
        //홀수 참여 불러오기
        let oddAddItems = await findTagInPosts(participants, '#홀수참여') || [];
        //전체 데이터에서 홀수 참여 제외
        participants = participants.filter(participant =>
            !oddAddItems.some(oddItem => {
                return oddItem.author.user_key === participant.author.user_key;})
        );
        //자찌름 불러오기 [a, b, c]
        let selfPairs = await findSelfPairs(post_key);
        //자찌름 목록 중 중도삭제자 제외, 참여자만 남김
        selfPairs = await checkParticipate(selfPairs, participants) || [];
        //전체 데이터 수-자찌름 수가 홀수인지 확인
        if ((participants.length - selfPairs.length) % 2 == 1) {
            //홀수라면 #홀수참여 참여시키기
            let count = oddAddItems.length;
            //홀수 참여 인원이 홀수라면 전원 참가
            //짝수면서 1명 이상이라면 마지막 인원 제외 참가            
            if(count % 2 === 1){
                participants = participants.concat(oddAddItems);
            }
            else if (count % 2 === 0 && count > 0) {
                // oddAddItems의 첫 번째 값 가져오기 (마지막 인원)
                const lastPerson = oddAddItems[0];
                // 참여자에서 lastPerson을 제외
                participants = participants.concat(oddAddItems);
                participants = participants.filter(author => author !== lastPerson);
            }

            //그럼에도 여전히 홀수라면
            if (participants.length % 2 == 1) {
                //#홀수제외 목록 불러오기
                let oddMinusItems = await findTagInPosts(participants, '#홀수제외') || [];
                //홀수 제외-가장 먼저 단 1명 제외
                if (oddMinusItems.length > 0) {
                    // oddMinusItems의 첫 번째 값 가져오기 (마지막 인원)
                    const lastPerson = oddMinusItems[oddMinusItems.length - 1];
                    // commentAuthors에서 lastPerson을 제외
                    participants = participants.filter(author => author !== lastPerson);
                }
            }
        }
        //짝수가 되었으면
        //맞찌름 불러오기 [[d,e], [f,g]]
        let mutualPairs = await findMutualPairs(post_key);
        //맞찌름 목록 중 중도삭제자 제외, 참여자만 남김
        mutualPairs = await checkParticipate(mutualPairs, participants);
        //선찌름 불러오기 [h, i, j]
        let oneSidedPairs = await findOnesidedPairs(post_key);    
        //선찌름 목록 중 중도삭제자 제외, 참여자만 남김
        oneSidedPairs = await checkParticipate(oneSidedPairs, participants);
        // 유저키 목록 추출
        const selfPairsId = new Set(selfPairs.map(selfPair => selfPair.user_key));
        const mutualPairsId = new Set(mutualPairs.flatMap(mutualPair => [
            mutualPair[0].user_key,
            mutualPair[1].user_key
        ]));
        const oneSidedPairsId = new Set(oneSidedPairs.map(oneSidedPair => oneSidedPair.user_key));


        //페어 매칭
        // 참가자 필터링 (ID 목록과 비교)
        const filteredParticipants = participants.filter(participant => {
            const userKey = participant.author.user_key;

            // 자찌름, 맞찌름, 선찌름에 포함되지 않은 참가자만 필터링
            return !selfPairsId.has(userKey) &&
                !mutualPairsId.has(userKey) &&
                !oneSidedPairsId.has(userKey);
        });

        //필터된 참가자 목록으로 랜덤 페어 생성 [[k,l], [m,n]]
        const randompairs = await createRandomPairs(filteredParticipants);
        let finalPairs = [];
        //자찌름을 finalPairs에 추가
        selfPairs.forEach(selfPair => {
            const matchingParticipant = participants.find(participant => {return participant.author.user_key === selfPair.user_key});
            if (matchingParticipant) {
                // [A, A] 형식으로 추가
                finalPairs.push([matchingParticipant, matchingParticipant]);
            }
        });
        //맞찌름을 finalPairs에 추가
        mutualPairs.forEach(mutualPair => {
            const matchingParticipants = mutualPair.map(pair =>
                participants.find(participant => participant.author.user_key === pair.user_key)
            );

            if (matchingParticipants) {
                finalPairs.push(matchingParticipants);
            }
        });
        //선찌름을 finalPairs에 추가
        oneSidedPairs.forEach(oneSidedPair => {
            const matchingParticipant = participants.find(participant => participant.author.user_key === oneSidedPair.user_key);
            const matchingParticipant2 = participants.find(participant => participant.author.user_key === oneSidedPair.opponent_key);

            if (matchingParticipant && matchingParticipant2) {
                finalPairs.push([matchingParticipant, matchingParticipant2]);
            }
        });
        //랜덤페어를 finalPairs에 추가
        finalPairs = finalPairs.concat(randompairs);

        //최종 페어 랜덤 정렬
        finalPairs = finalPairs.sort(() => Math.random() - 0.5);

        return finalPairs;
    } catch (error) {
        console.error('Error making random pairs :', error);
    }
}

module.exports = { PairStatus, createPair, getPairsInEarlyOrder, findPair, updatePair, makeFinalPairs };
