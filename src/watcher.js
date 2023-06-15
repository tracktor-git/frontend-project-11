import onChange from 'on-change';

export default (elements, i18n, initialState) => {
  const renderForm = (state) => {
    const { form, submit, input } = elements;

    switch (state.form.enabled) {
      case true:
        submit.removeAttribute('disabled');
        input.removeAttribute('disabled');
        break;
      case false:
        submit.setAttribute('disabled', '');
        input.setAttribute('disabled', '');
        break;
      default:
        break;
    }

    switch (state.form.valid) {
      case true:
        form.url.classList.remove('is-invalid');
        break;
      case false:
        form.url.classList.add('is-invalid');
        break;
      default:
        break;
    }

    if (state.form.submitSuccess && state.rss.loaded) {
      form.reset();
    }
  };

  const renderFeedback = (state) => {
    const { feedback } = elements;

    switch (state.feedback.valid) {
      case true:
        feedback.classList.remove('text-danger');
        feedback.classList.add('text-success');
        break;
      case false:
        feedback.classList.add('text-danger');
        feedback.classList.remove('text-success');
        break;
      default:
        break;
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

  const generateContainer = (data, type, state) => {
    const container = document.createElement('div');
    container.classList.add('card', 'border-0');

    const containerBody = document.createElement('div');
    containerBody.classList.add('card-body');

    const containerTitle = document.createElement('h2');
    containerTitle.classList.add('card-title', 'h4');
    containerTitle.textContent = type === 'posts' ? i18n.t('posts') : i18n.t('feeds');

    const ul = document.createElement('ul');
    ul.classList.add('list-group', 'border-0', 'rounded-0');

    const visitedPostsIds = [...state.uiState.visitedPostsIds];

    const liElements = type === 'posts' ? generatePosts(data, visitedPostsIds) : generateFeeds(data);

    ul.append(...liElements);
    containerBody.append(containerTitle);
    container.append(containerBody, ul);
    container.addEventListener('click', (event) => {
      if (['A', 'BUTTON'].includes(event.target.tagName)) {
        const id = Number(event.target.dataset.id);
        state.uiState.visitedPostsIds.add(id);
        state.uiState.modalId = id;
      }
    });

    return container;
  };

  const renderModal = (posts, modalId) => {
    const modalTitle = elements.modal.querySelector('.modal-title');
    const modalBody = elements.modal.querySelector('.modal-body');
    const readMoreButton = elements.modal.querySelector('.full-article');
    const [currentPost] = posts.filter(({ id }) => id === modalId);
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
        elements.posts.append(generateContainer(current, 'posts', state));
        break;
      case 'rss.feeds':
        elements.feeds.innerHTML = '';
        elements.feeds.append(generateContainer(current, 'feeds', state));
        break;
      case 'uiState.modalId':
        renderModal(state.rss.posts, current);
        break;
      case 'uiState.visitedPostsIds':
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
