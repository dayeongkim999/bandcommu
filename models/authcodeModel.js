const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const authcodeSchema = new mongoose.Schema({
    nickname: {
        type: String,
        required: true,
    },
    user_key: {
        type: String
    },
    hashCode: {
        type: String,
        required: true
    },
    isVerified: {
        type: Boolean,
        required: true
    },
    lastAccess: {
        type: String
    }
},
{
    timestamps: true,
});


const Authcode = mongoose.model("authcodes", authcodeSchema);

// 해싱 및 데이터베이스 삽입
const createAuthcode = async function(nickname, authCode) {
    try {
        // 인증 코드 해싱
        const hashedCode = await bcrypt.hash(authCode, 10); // 10은 saltRounds 값

        // MongoDB에 데이터 삽입
        const result = await Authcode.create({
            nickname: nickname,
            hashCode: hashedCode,
            isVerified: false
        });

        console.log('Authcode inserted:', result);
    } catch (error) {
        console.error('Error inserting Authcode:', error);
    }
}

const verifyAuthcode = async function(inputCode, storedHash) {
    const isMatch = await bcrypt.compare(inputCode, storedHash);
    return isMatch; // true 또는 false 반환
}

const findUserByNickname = async function(nickname){
    try {
        const user = await Authcode.findOne({ nickname });
        return user; // 사용자 객체 반환
    } catch (error) {
        console.error('Error finding user by nickname:', error);
        throw error; // 오류를 호출한 곳으로 전달
    }
}

const findUserByUserkey = async function(user_key){
    try {
        const user = await Authcode.findOne({ user_key });
        return user; // 사용자 객체 반환
    } catch (error) {
        console.error('Error finding user by user_key:', error);
        throw error; // 오류를 호출한 곳으로 전달
    }
}

const updateUserByNickname = async function(nickname, user_key){
    try {
        //닉네임이 존재하나 확인
        const user = await findUserByNickname(nickname);
        console.log("update user" + user);
        if(!user){
            throw new Error(`User with nickname '${nickname}' not found`);
        }
        //업뎃
        const isUpdate = await Authcode.updateOne(
            {nickname: nickname},
            { $set: {user_key: user_key, isVerified: true} }
        );
        return isUpdate.acknowledged;
    } catch (error) {
        console.error('Error finding user by user_key:', error);
        throw error; // 오류를 호출한 곳으로 전달
    }
}

const findByIdAndDelete = async function(userId){
    try {
        //유저 삭제
        const result = await Authcode.deleteOne(
            {_id: userId}
        );
        
        if (result.deletedCount === 0) {
            throw new Error(`User with id '${userId}' not found`);
        }

        return result;
    } catch (error) {
        console.error('Error deleting user by id:', error);
        throw error; // 오류를 호출한 곳으로 전달
    }
}

const updateAccessTime = async function(user, accessTime){
    try{
        await Authcode.updateOne(
            { _id: user._id },
            { $set: { lastAccess: accessTime } }
        );
    } catch(error){
        console.error('Error updating access time by id:', error);
        throw error; // 오류를 호출한 곳으로 전달
    }
}

module.exports = {Authcode, createAuthcode, verifyAuthcode, findUserByNickname, findUserByUserkey, updateUserByNickname, findByIdAndDelete, updateAccessTime};