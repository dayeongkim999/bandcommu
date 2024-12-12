const express = require('express');
const router = express.Router();
const { getDeadline, getPairgameData, getPairgameCompleteLink } = require('../../controllers/pairgameController');
const checkLogin = require('../../middlewares/checkLogin');

// 찌름 마감 시간 반환 API
router.route('/deadline').get(checkLogin, getDeadline);
// 페어게임 데이터 반환 API
router.route('/data/:post_key').get(checkLogin, getPairgameData);
// 찌름 마감 시간이 지났다면 링크 반환해주는 API
router.route('/checkdeadline').get(checkLogin, getPairgameCompleteLink);

module.exports = router;
