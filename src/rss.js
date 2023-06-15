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

const uniqId = () => {
  let count = 0;
  return () => {
    count += 1;
    return count;
  };
};

const getPostUniqId = uniqId();

export const getPosts = (rss) => {
  const items = rss.querySelectorAll('item');
  const posts = [...items].reduce((acc, item) => {
    const title = item.querySelector('title').textContent;
    const link = item.querySelector('link').textContent;
    const description = item.querySelector('description').textContent;
    const pubDate = item.querySelector('pubDate').textContent;
    return [
      ...acc,
      {
        title,
        link,
        description,
        pubDate,
        id: getPostUniqId(),
      },
    ];
  }, []);
  return posts;
};

export const getFeed = (rss, url) => {
  const channel = rss.querySelector('channel');
  const title = channel.querySelector('title').textContent;
  const description = channel.querySelector('description').textContent;
  return { title, description, url };
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
