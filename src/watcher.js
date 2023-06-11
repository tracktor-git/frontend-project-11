import onChange from 'on-change';

export default (elements, i18n, initialState) => {
  const renderForm = (state) => {
    const { form, submit, input } = elements;

    if (state.form.enabled) {
      submit.removeAttribute('disabled');
      input.removeAttribute('disabled');
    } else {
      submit.setAttribute('disabled', '');
      input.setAttribute('disabled', '');
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

  const generatePosts = (posts, visitedPostsIds) => {
    const postsList = posts.map(({ title, link, id }) => {
      const li = document.createElement('li');
      li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');

      const a = document.createElement('a');
      a.classList.add('fw-bold');
      a.setAttribute('target', '_blank');
      a.textContent = title;
      a.href = link;
      a.dataset.id = id;

      if (visitedPostsIds.includes(id)) {
        a.classList.remove('fw-bold');
        a.classList.add('fw-normal', 'link-secondary');
      }

      const button = document.createElement('button');
      button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
      button.dataset.id = id;
      button.dataset.bsToggle = 'modal';
      button.dataset.bsTarget = '#modal';
      button.textContent = i18n.t('previewButton');

      li.append(a, button);
      return li;
    });

    return postsList;
  };

  const generateFeeds = (feeds) => {
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

  const generateCard = (data, type, state) => {
    const card = document.createElement('div');
    card.classList.add('card', 'border-0');

    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body');

    const cardTitle = document.createElement('h2');
    cardTitle.classList.add('card-title', 'h4');
    cardTitle.textContent = type === 'posts' ? i18n.t('posts') : i18n.t('feeds');

    const ul = document.createElement('ul');
    ul.classList.add('list-group', 'border-0', 'rounded-0');

    const visitedPostsIds = [...state.rss.visitedPostsIds];

    const liElements = type === 'posts' ? generatePosts(data, visitedPostsIds) : generateFeeds(data);

    ul.append(...liElements);
    cardBody.append(cardTitle);
    card.append(cardBody, ul);
    return card;
  };

  const renderModal = (state, modalId) => {
    const modalTitle = elements.modal.querySelector('.modal-title');
    const modalBody = elements.modal.querySelector('.modal-body');
    const readMoreButton = elements.modal.querySelector('.full-article');
    const [currentPost] = [...state.rss.posts].filter(({ id }) => id === modalId);
    const { title, description, link } = currentPost;
    modalTitle.textContent = title;
    modalBody.textContent = description;
    readMoreButton.setAttribute('href', link);
  };

  const renderPostLink = (visitedPostsIds) => {
    const lastId = Array.from(visitedPostsIds).at(-1);
    const currentLink = document.querySelector(`a[data-id="${lastId}"]`);
    currentLink.classList.remove('fw-bold');
    currentLink.classList.add('fw-normal', 'link-secondary');
  };

  const state = onChange(initialState, (path, current) => {
    switch (path) {
      case 'rss.posts':
        elements.posts.innerHTML = '';
        elements.posts.append(generateCard(current, 'posts', state));
        break;
      case 'rss.feeds':
        elements.feeds.innerHTML = '';
        elements.feeds.append(generateCard(current, 'feeds', state));
        break;
      case 'modalId':
        renderModal(state, current);
        break;
      case 'rss.visitedPostsIds':
        renderPostLink(current);
        break;
      case 'form.enabled':
      case 'form.valid':
      case 'form.submitSuccess':
        renderForm(state);
        break;
      case 'feedback.valid':
      case 'feedback.message':
        renderFeedback(state);
        break;
      default:
        break;
    }
  });

  return state;
};
