const mongoose = require("mongoose");
const { v4: uuidv4 } = require('uuid'); //v4: 외부정보에 의존하지 않고 완전한 랜덤 값

const templinkSchema = new mongoose.Schema({
    token: { type: String, required: true },
    notice_id: { type: Number, required: true },
    user_id: { type: String, required: true},
    created_at: { type: Date, default: Date.now },
    expires_at: { type: Date, required: true },
},
{
    timestamps: true,
});

// TTL 인덱스 설정
TempLinkSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

const TempLink = mongoose.model('TempLink', TempLinkSchema);


//링크 생성
async function createTempLink(notice_id, user_id, expiry_hours = 24) {
    const token = uuidv4();
    const expires_at = new Date(Date.now() + expiry_hours * 60 * 60 * 1000);

    const tempLink = new TempLink({ token, notice_id, user_id, expires_at });
    await tempLink.save();

    return `/external/pairgame/${token}`;
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

    return tempLink;
}

//존재하나 찾기
async function findTempLinkbyUserId(user_id) {
    const tempLink = await TempLink.findOne({ user_id });

    if (!tempLink) {
        throw new Error('Link not found');
    }

    if (tempLink.is_used) {
        throw new Error('Link already used');
    }

    return tempLink.notice_id;
}


module.exports = {TempLink, createTempLink, handleTempLink, findTempLinkbyUserId};