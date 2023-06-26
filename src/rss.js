const axios = require('axios');

const parseRss = (data) => {
  const parser = new DOMParser();
  const rss = parser.parseFromString(data, 'application/xml');
  const parseErrorNode = rss.querySelector('parsererror');
  if (parseErrorNode) {
    const errorText = `Parse error: ${parseErrorNode.textContent}`;
    throw new Error(errorText);
  }

  const items = rss.querySelectorAll('item');
  const feedTitle = rss.querySelector('channel > title').textContent;
  const feedDescription = rss.querySelector('channel > description').textContent;

  const posts = [...items].reduce((acc, item) => {
    const postTitle = item.querySelector('title').textContent;
    const link = item.querySelector('link').textContent;
    const postDescription = item.querySelector('description').textContent;
    return [
      ...acc,
      {
        title: postTitle,
        description: postDescription,
        link,
      },
    ];
  }, []);

  return { title: feedTitle, description: feedDescription, posts };
};

const addPostsId = (content) => {
  const { posts, ...rest } = content;
  const postsWithId = posts.map((post) => {
    post.id = Math.random();
    return post;
  });

  return { posts: postsWithId, ...rest };
};

const getContent = (url) => {
  const allOriginsUrl = new URL('get', 'https://allorigins.hexlet.app');
  allOriginsUrl.searchParams.set('disableCache', true);
  allOriginsUrl.searchParams.set('url', url);
  return axios
    .get(allOriginsUrl)
    .then((response) => response.data)
    .then((data) => ({ url, ...addPostsId(parseRss(data.contents)) }))
    .catch((error) => {
      console.error(error);
      if (error.message.startsWith('Parse error')) {
        throw new Error('parseError');
      }
      if (error.message.startsWith('Network Error')) {
        throw new Error('networkError');
      }
      throw error;
    });
};

export default getContent;
