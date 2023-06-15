import * as yup from 'yup';
import i18next from 'i18next';
import resources from './locales/index';
import getContent, { getFeed, getPosts } from './rss';
import watch from './watcher';

const initState = {
  form: {
    valid: true,
    enabled: true,
    submitSuccess: false,
  },
  feedback: {
    valid: true,
    message: '',
  },
  rss: {
    loaded: false,
    feeds: [],
    posts: [],
  },
  uiState: {
    modalId: null,
    visitedPostsIds: new Set(),
  },
};

const elements = {
  form: document.querySelector('form'),
  feedback: document.querySelector('.feedback'),
  submit: document.querySelector('button[type="submit"]'),
  input: document.querySelector('input[name="url"]'),
  posts: document.querySelector('.posts'),
  feeds: document.querySelector('.feeds'),
  modal: document.querySelector('#modal'),
};

const defaultLang = 'ru';
const i18n = i18next.createInstance();

const state = watch(elements, i18n, initState);

const validate = (url, urls) => {
  yup.setLocale({
    string: {
      url: () => i18n.t('errors.invalidUrl'),
    },
    mixed: {
      notOneOf: () => i18n.t('errors.existingUrl'),
      required: () => i18n.t('errors.required'),
    },
  });

  const schema = yup.string().url().notOneOf(urls).required();
  return schema.validate(url, { abortEarly: false });
};

const storeRss = (data) => {
  const { url, content } = data;
  const feed = getFeed(content, url);
  const posts = getPosts(content);
  state.rss.posts = [...posts, ...state.rss.posts];
  state.rss.feeds = [feed, ...state.rss.feeds];
  state.rss.loaded = true;
  state.feedback.valid = true;
  state.feedback.message = i18n.t('loadSuccess');
};

const extractUrls = (feeds) => feeds.map(({ url }) => url);
const noop = () => {};

const listenRss = (time) => {
  setTimeout(() => {
    const urls = extractUrls(state.rss.feeds);
    const promises = urls.map(getContent);
    Promise.all(promises)
      .then((results) => {
        const contents = results.map(({ content }) => getPosts(content));
        const links = [...state.rss.posts].map((post) => post.link);
        const newPosts = contents.flat().filter(({ link }) => !links.includes(link));
        if (newPosts.length > 0) {
          state.rss.posts = [...newPosts, ...state.rss.posts];
        }
      })
      .catch((error) => noop(error));
    listenRss(time);
  }, time);
};

export default () => {
  listenRss(5000);

  i18n
    .init({
      debug: false,
      lng: defaultLang,
      resources,
    })
    .then(() => {
      elements.form.addEventListener('submit', (event) => {
        event.preventDefault();
        const inputUrl = event.target.url.value.trim().replace(/\/{1,}$/, '');
        state.feedback.message = '';
        const urls = extractUrls(state.rss.feeds);

        validate(inputUrl, urls)
          .then((url) => {
            state.form.enabled = false;
            state.form.submitSuccess = false;
            state.form.valid = true;
            return url;
          })
          .then((url) => getContent(url))
          .then((data) => storeRss(data))
          .then(() => {
            state.form.submitSuccess = true;
          })
          .catch((error) => {
            state.feedback.valid = false;
            if (error instanceof yup.ValidationError) {
              state.form.valid = false;
              const [message] = error.errors;
              state.feedback.message = message;
              return;
            }
            state.rss.loaded = false;
            state.feedback.message = i18n.t(`errors.${error.message}`);
          })
          .finally(() => {
            state.form.submitSuccess = false;
            state.form.enabled = true;
          });
      });
    });
};
