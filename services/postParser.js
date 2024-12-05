// 글 목록의 내용 첫 줄을 읽어 #공지를 찾는 함수
function findTagInPosts(posts, text='#공지') {
    return posts.filter(post => {
        const firstLine = (post.content.split('\n')[0] || '').trim();
        return firstLine.includes(text);
    });
}

module.exports = findTagInPosts;