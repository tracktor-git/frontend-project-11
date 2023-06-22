const axios = require('axios');

const parseRss = (data) => {
  const parser = new DOMParser();
  const result = parser.parseFromString(data, 'application/xml');
  const parseErrorNode = result.querySelector('parsererror');
  if (parseErrorNode) {
    throw new Error('contentError');
  }
  return result;
};

export const getFeed = (rss, url) => {
  const items = rss.querySelectorAll('item');
  const feedTitle = rss.querySelector('channel > title').textContent;
  const feedDescription = rss.querySelector('channel > description').textContent;

  const posts = [...items].reduce((acc, item) => {
    const postTitle = item.querySelector('title').textContent;
    const link = item.querySelector('link').textContent;
    const postDescription = item.querySelector('description').textContent;
    const pubDate = item.querySelector('pubDate').textContent;
    return [
      ...acc,
      {
        title: postTitle,
        link,
        description: postDescription,
        pubDate,
        id: Math.random(),
      },
    ];
  }, []);

  return {
    title: feedTitle,
    description: feedDescription,
    url,
    posts,
  };
};

const getContent = (url) => {
  const allOriginsUrl = new URL('get', 'https://allorigins.hexlet.app');
  allOriginsUrl.searchParams.set('disableCache', true);
  allOriginsUrl.searchParams.set('url', url);
  return axios
    .get(allOriginsUrl)
    .then((response) => response.data)
    .then((data) => ({ url, content: parseRss(data.contents) }))
    .catch((error) => {
      throw error.message === 'Network Error' ? new Error('networkError') : error;
    });
};

export default getContent;
