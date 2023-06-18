import * as yup from 'yup';
import i18next from 'i18next';
import resources from './locales/index';
import getContent, { getFeed, getPosts } from './rss';
import watch from './watcher';

const initState = {
  form: {
    valid: true,
    errorText: '',
  },
  loadingProcess: {
    status: 'idle', // loading, failed, idle, success
    errorText: '',
  },
  rss: {
    feeds: [],
    posts: [],
  },
  uiState: {
    modalPostId: null,
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
        state.form.valid = true;
        const inputUrl = event.target.url.value.trim().replace(/\/{1,}$/, '');
        const urls = extractUrls(state.rss.feeds);

        validate(inputUrl, urls)
          .then((url) => {
            state.loadingProcess.status = 'loading';
            return getContent(url);
          })
          .then((data) => {
            const { url, content } = data;
            const feed = getFeed(content, url);
            const posts = getPosts(content);
            state.rss.posts = [...posts, ...state.rss.posts];
            state.rss.feeds = [feed, ...state.rss.feeds];
            state.loadingProcess.status = 'success';
          })
          .catch((error) => {
            const errorMessage = error.message;
            if (error instanceof yup.ValidationError) {
              state.form.errorText = errorMessage;
              state.form.valid = false;
              return;
            }
            state.loadingProcess.errorText = i18n.t(`errors.${errorMessage}`);
            state.loadingProcess.status = 'failed';
          })
          .finally(() => {
            state.loadingProcess.status = 'idle';
          });
      });
    });
};
