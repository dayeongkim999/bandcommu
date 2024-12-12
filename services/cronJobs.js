//사용 X
// const cron = require('node-cron');
// const { writingPair } = require('../controllers/pairgameController');

// // 오후 11시부터 자정(12시)까지 5분 간격으로 실행
// cron.schedule('*/5 23 * * *', async () => {
//     console.log('Checking for expired access_restricted_at entries...');

//     const now = roundToMinutes(new Date());
//     const expiredLinks = await TempLink.find({
//         access_restricted_at: { $lte: now }
//     });

//     for (const link of expiredLinks) {
//         // access_restricted_at을 roundToMinutes로 변환
//         link.access_restricted_at = roundToMinutes(link.access_restricted_at);

//         console.log(`Expired link detected: ${link.token} with rounded time: ${link.access_restricted_at}`);
//         // 실행할 함수 호출
//         await writingPair();
//     }
// });

// //분 단위로 변환
// function roundToMinutes(date) {
//     return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes());
// }
