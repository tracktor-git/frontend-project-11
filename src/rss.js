const axios = require('axios');

const parseRss = (data) => {
  const parser = new DOMParser();
  const result = parser.parseFromString(data, 'application/xml');
  return result;
};

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
      },
    ];
  }, []);
  return posts;
};

export const getFeed = (rss) => {
  const channel = rss.querySelector('channel');
  const title = channel.querySelector('title').textContent;
  const description = channel.querySelector('description').textContent;
  return { title, description };
};

const getContent = (url) => {
  const allOriginsUrl = `https://allorigins.hexlet.app/get?disableCache=true&url=${url}`;
  return axios
    .get(allOriginsUrl)
    .then((response) => response.data)
    .then((data) => {
      if (data.status.http_code !== 200) {
        throw new Error('Connection error');
      }
      if (!data.status.content_type.includes('application/rss+xml')) {
        throw new Error('Invalid RSS');
      }
      return { url, content: parseRss(data.contents) };
    })
    .catch((error) => {
      throw error;
    });
};

export default getContent;
