import * as yup from 'yup';
import i18next from 'i18next';
import resources from './locales/index';
import getContent, { getFeed, getPosts } from './rss';
import state, { elements } from './view';

const defaultLang = 'ru';
export const i18n = i18next.createInstance();

const validate = (url, urls) => yup
  .string()
  .url(i18n.t('errors.invalidUrl'))
  .notOneOf(urls, i18n.t('errors.existingUrl'))
  .required(i18n.t('errors.required'))
  .validate(url, { abortEarly: false });

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

export default () => {
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
        state.form.valid = true;
        return url;
      })
      .then((url) => getContent(url))
      .then((data) => loadRss(data))
      .catch((error) => {
        state.rss.loaded = false;
        if (error instanceof yup.ValidationError) {
          state.feedback.valid = false;
          state.form.valid = false;
          const [message] = error.errors;
          state.feedback.message = message;
          return;
        }
        state.feedback.valid = false;
        state.feedback.message = i18n.t('errors.parseError');
      })
      .finally(() => {
        state.form.submitEnabled = true;
      });
  });
};
