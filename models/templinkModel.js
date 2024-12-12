const mongoose = require("mongoose");
const { v4: uuidv4 } = require('uuid'); //v4: 외부정보에 의존하지 않고 완전한 랜덤 값

const templinkSchema = new mongoose.Schema({
    token: { type: String, required: true },
    notice_id: { type: String, required: true },
    band_key: { type: String, required: true},
    band_cover: {type: String, required: true},
    band_name: {type: String, required: true},
    expires_at: { type: Date, required: true },
},
{
    timestamps: true,
});

// TTL 인덱스 설정
templinkSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

const TempLink = mongoose.model('TempLink', templinkSchema);


//링크 생성
async function createTempLink(notice_id, band_key, band_cover, band_name, hour = 23, minute = 30) {
    const token = uuidv4();
    const now = new Date(); // 현재 시각을 정의
    const expires_at = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0); // 당일 오후 11시 30분

    const tempLink = new TempLink({ token, notice_id, band_key, band_cover, band_name, expires_at });
    await tempLink.save();

    return tempLink;
}

//링크 사용가능 확인
async function handleTempLink(token) {
    const tempLink = await TempLink.findOne({ token });

    if (!tempLink) {
        throw new Error('Link not found');
    }

    if (tempLink.is_used) {
        throw new Error('Link already used');
    }

    return `/external/pairgame/${tempLink.notice_id}/${tempLink.band_key}`;
}

//존재하나 찾기
async function findTempLinkbyBandKey(band_key) {
    const tempLink = await TempLink.findOne({ band_key: band_key });

    if (!tempLink) {
        return null;
    }

    return tempLink;
}


module.exports = {TempLink, createTempLink, handleTempLink, findTempLinkbyBandKey};