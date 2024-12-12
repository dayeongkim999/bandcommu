const mongoose = require('mongoose');

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
        if (selfPairs) {
            pairs = pairs.filter(p => p._id.toString() !== selfPairs._id.toString());
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
async function getPairsExcludedMutualPairs(post_key){
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
async function findOnesidedPairs(){
    try{
        //자찌름 제외 맞찌름 제외 찌름 목록 불러오기
        let pairs = await getPairsExcludedMutualPairs(post_key);

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

        pairs.forEach(pair => {
            pair.opponent_key
            //실패: 자찌름으로 이미 짝 존재
            //실패: 맞찌름으로 이미 짝 존재
            //실패: 다른 사람이 먼저 찔러서 이미 짝 존재
            pairsKey.forEach(existKey =>{
                if (pair.opponent_key === existKey){
                    //누군가와 이미 짝이 지어졌다면
                    
                    //찌름 불가
                }
            });
        })

        //선찌름 매칭

        return pairs;
    }catch (error) {
        console.error('Error finding one sided pairs:', error);
    }    
}

//매칭 가능한 선찌름 제외 목록 불러오기

module.exports = { PairStatus, createPair, getPairsInEarlyOrder, findPair, updatePair, findSelfPairs, getPairsExcludedSelfPairs };
