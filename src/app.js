import * as yup from 'yup';
import i18next from 'i18next';
import resources from './locales/index';
import getContent, { getFeed, getPosts } from './rss';
import state, { elements } from './view';

const defaultLang = 'ru';
export const i18n = i18next.createInstance();

const validate = (url, urls) => {
  yup.setLocale({
    string: {
      url: () => (i18n.t('errors.invalidUrl')),
    },
    mixed: {
      notOneOf: () => (i18n.t('errors.existingUrl')),
      required: () => (i18n.t('errors.required')),
    },
  });

  const schema = yup
    .string()
    .url()
    .notOneOf(urls)
    .required();

  return schema.validate(url, { abortEarly: false });
};

const loadRss = (data) => {
  const { url, content } = data;
  const feed = getFeed(content);
  const posts = getPosts(content);
  state.rss.posts = [...posts, ...state.rss.posts];
  state.rss.feeds = [feed, ...state.rss.feeds];
  state.urls = [url, ...state.urls];
  state.rss.loaded = true;
  state.feedback.valid = true;
  state.feedback.message = i18n.t('loadSuccess');
};

const listenRss = (time) => {
  setTimeout(() => {
    const urls = [...state.urls];
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
      .catch((error) => {
        console.error(error.message);
      });
    listenRss(time);
  }, time);
};

export default () => {
  listenRss(5000);
  elements.posts.addEventListener('click', (event) => {
    if (['BUTTON', 'A'].includes(event.target.tagName)) {
      const { id } = event.target.dataset;
      if (!state.rss.visitedIds.includes(id)) {
        state.rss.visitedIds.push(Number(id));
      }
    }
  });

  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();
    state.form.url = event.target.url.value.trim().replace(/\/{1,}$/, '');
    state.feedback.message = '';
    i18n
      .init({
        debug: false,
        lng: defaultLang,
        resources,
      })
      .then(() => validate(state.form.url, state.urls))
      .then((url) => {
        state.form.submitEnabled = false;
        state.form.submitSuccess = false;
        state.form.valid = true;
        return url;
      })
      .then((url) => getContent(url))
      .then((data) => loadRss(data))
      .then(() => {
        state.form.submitSuccess = true;
      })
      .catch((error) => {
        state.rss.loaded = false;
        state.feedback.valid = false;
        if (error instanceof yup.ValidationError) {
          state.form.valid = false;
          const [message] = error.errors;
          state.feedback.message = message;
          return;
        }
        state.feedback.message = i18n.t(`errors.${error.message}`);
      })
      .finally(() => {
        state.form.submitSuccess = false;
        state.form.submitEnabled = true;
      });
  });
};
