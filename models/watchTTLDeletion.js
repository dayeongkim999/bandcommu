const mongoose = require('mongoose');
const { matchingPair } = require('../controllers/pairgameController');

// Change Stream으로 TTL 삭제 이벤트 감지
async function watchTTLDeletion() {
    try {
        // 링크 만료 감지
        const collection = mongoose.connection.collection('templinks');

        // Change Stream 설정
        const changeStream = collection.watch([
            { $match: { operationType: 'delete' } } // 삭제 이벤트만 감지
        ], {fullDocument: 'updateLookup'} );

        console.log('Watching for TTL document deletions...');

        // Change Stream 이벤트 핸들링
        changeStream.on('change', async (change) => {
            console.log('Detected TTL deletion:', change);

            // 삭제되기 전 데이터에서 band_key와 post_key 추출
            const { _id } = change.documentKey;
            const deletedDocument = change.fullDocument; // fullDocument 옵션이 필요

            if (deletedDocument) {
                const { band_key, post_key } = deletedDocument;
                console.log(`band_key: ${band_key}, post_key: ${post_key}`);

                // 추출한 band_key와 post_key를 이용해 작업 시작
                const pairList = await matchingPair(band_key, post_key);
            }
        });
    } catch (error) {
        console.error('Error watching TTL deletions:', error);
    }
}

module.exports = { watchTTLDeletion };
