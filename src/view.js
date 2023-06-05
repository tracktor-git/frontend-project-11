import onChange from 'on-change';

const initState = {
  form: {
    valid: true,
    submitEnabled: true,
    submitSuccess: false,
    url: '',
  },
  feedback: {
    valid: true,
    message: '',
  },
  rss: {
    loaded: false,
    feeds: [],
    posts: [],
    visitedIds: [],
  },
  modal: {
    header: '',
    body: '',
  },
  urls: [],
};

export const elements = {
  form: document.querySelector('form'),
  feedback: document.querySelector('.feedback'),
  submit: document.querySelector('button[type="submit"]'),
  posts: document.querySelector('.posts'),
  feeds: document.querySelector('.feeds'),
  modal: document.querySelector('#modal'),
};

const renderForm = (state) => {
  const { form, submit } = elements;

  if (state.form.submitEnabled) {
    submit.removeAttribute('disabled');
  } else {
    submit.setAttribute('disabled', '');
  }

  if (state.form.submitSuccess && state.rss.loaded) {
    form.reset();
  }

  if (state.form.valid) {
    form.url.classList.remove('is-invalid');
  } else {
    form.url.classList.add('is-invalid');
  }
};

const renderFeedback = (state) => {
  const { feedback } = elements;

  if (state.feedback.valid) {
    feedback.classList.remove('text-danger');
    feedback.classList.add('text-success');
  } else {
    feedback.classList.add('text-danger');
    feedback.classList.remove('text-success');
  }

  feedback.textContent = state.feedback.message;
};

const renderPosts = (posts, visitedIds) => {
  const postsList = posts.map(({
    title, link, description, id,
  }) => {
    const li = document.createElement('li');
    li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');

    const a = document.createElement('a');
    a.classList.add('fw-bold');
    a.setAttribute('target', '_blank');
    a.textContent = title;
    a.href = link;
    a.dataset.id = id;

    a.addEventListener('click', () => {
      a.classList.remove('fw-bold');
      a.classList.add('fw-normal', 'link-secondary');
    });

    if (visitedIds.includes(id)) {
      a.classList.remove('fw-bold');
      a.classList.add('fw-normal', 'link-secondary');
    }

    const button = document.createElement('button');
    button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
    button.dataset.id = id;
    button.dataset.bsToggle = 'modal';
    button.dataset.bsTarget = '#modal';
    button.textContent = 'Просмотр';

    button.addEventListener('click', (event) => {
      event.preventDefault();
      const modalTitle = document.querySelector('.modal-title');
      const modalBody = document.querySelector('.modal-body');
      const readMoreButton = document.querySelector('.modal-footer a');
      modalTitle.textContent = title;
      modalBody.textContent = description;
      readMoreButton.href = link;
      a.classList.remove('fw-bold');
      a.classList.add('fw-normal', 'link-secondary');
    });

    li.append(a, button);
    return li;
  });

  return postsList;
};

const renderFeeds = (feeds) => {
  const feedsList = feeds.map(({ title, description }) => {
    const li = document.createElement('li');
    li.classList.add('list-group-item', 'border-0', 'border-end-0');

    const h3 = document.createElement('h3');
    h3.classList.add('h6', 'm-0');
    h3.textContent = title;

    const p = document.createElement('p');
    p.classList.add('m-0', 'small', 'text-black-50');
    p.textContent = description;

    li.append(h3, p);

    return li;
  });

  return feedsList;
};

const renderCard = (data, type, state) => {
  const card = document.createElement('div');
  card.classList.add('card', 'border-0');

  const cardBody = document.createElement('div');
  cardBody.classList.add('card-body');

  const cardTitle = document.createElement('h2');
  cardTitle.classList.add('card-title', 'h4');
  cardTitle.textContent = type === 'posts' ? 'Посты' : 'Фиды';

  const ul = document.createElement('ul');
  ul.classList.add('list-group', 'border-0', 'rounded-0');

  const visitedIds = [...state.rss.visitedIds];

  const liElements = type === 'posts' ? renderPosts(data, visitedIds) : renderFeeds(data);

  ul.append(...liElements);
  cardBody.append(cardTitle);
  card.append(cardBody, ul);
  return card;
};

const state = onChange(initState, (path, current) => {
  renderForm(state);
  renderFeedback(state);
  switch (path) {
    case 'rss.posts':
      elements.posts.innerHTML = '';
      elements.posts.append(renderCard(current, 'posts', state));
      break;
    case 'rss.feeds':
      elements.feeds.innerHTML = '';
      elements.feeds.append(renderCard(current, 'feeds', state));
      break;
    default:
      break;
  }
});

export default state;
