import onChange from 'on-change';

export default (elements, i18n, initialState) => {
  const renderForm = (formState) => {
    const { form, feedback } = elements;

    if (!formState.valid) {
      form.url.classList.add('is-invalid');
      feedback.classList.replace('text-success', 'text-danger');
      feedback.textContent = formState.errorText;
      return;
    }
    form.url.classList.remove('is-invalid');
    feedback.classList.replace('text-danger', 'text-success');
  };

  const loadingProcessHandler = (processState) => {
    const { feedback, input, submit } = elements;

    switch (processState.status) {
      case 'loading':
        feedback.textContent = '';
        submit.setAttribute('disabled', '');
        input.setAttribute('disabled', '');
        break;
      case 'success':
        feedback.textContent = i18n.t('loadSuccess');
        feedback.classList.replace('text-danger', 'text-success');
        elements.form.reset();
        break;
      case 'failed':
        feedback.textContent = processState.errorText;
        feedback.classList.replace('text-success', 'text-danger');
        break;
      case 'idle':
        submit.removeAttribute('disabled');
        input.removeAttribute('disabled');
        elements.input.focus();
        break;
      default:
        throw new Error('Invalid loading process status');
    }
  };

  const generatePosts = (posts, visitedPostsIds) => {
    const postsList = posts.map(({ title, link, id }) => {
      const liElement = document.createElement('li');
      liElement.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');

      const postLink = document.createElement('a');
      postLink.classList.add('fw-bold');
      postLink.setAttribute('target', '_blank');
      postLink.textContent = title;
      postLink.href = link;
      postLink.dataset.id = id;

      if (visitedPostsIds.includes(id)) {
        postLink.classList.remove('fw-bold');
        postLink.classList.add('fw-normal', 'link-secondary');
      }

      const previewButton = document.createElement('button');
      previewButton.classList.add('btn', 'btn-outline-primary', 'btn-sm');
      previewButton.dataset.id = id;
      previewButton.dataset.bsToggle = 'modal';
      previewButton.dataset.bsTarget = '#modal';
      previewButton.textContent = i18n.t('previewButton');

      liElement.append(postLink, previewButton);
      return liElement;
    });

    return postsList;
  };

  const generateFeeds = (feeds) => {
    const feedsList = feeds.map(({ title, description }) => {
      const liElement = document.createElement('li');
      liElement.classList.add('list-group-item', 'border-0', 'border-end-0');

      const feedHeader = document.createElement('h3');
      feedHeader.classList.add('h6', 'm-0');
      feedHeader.textContent = title;

      const feedDescription = document.createElement('p');
      feedDescription.classList.add('m-0', 'small', 'text-black-50');
      feedDescription.textContent = description;

      liElement.append(feedHeader, feedDescription);

      return liElement;
    });

    return feedsList;
  };

  const generateContainer = (data, type, state) => {
    const container = document.createElement('div');
    const containerBody = document.createElement('div');
    const containerTitle = document.createElement('h2');
    const ulElement = document.createElement('ul');

    container.classList.add('card', 'border-0');
    containerBody.classList.add('card-body');
    containerTitle.classList.add('card-title', 'h4');
    containerTitle.textContent = type === 'posts' ? i18n.t('posts') : i18n.t('feeds');
    ulElement.classList.add('list-group', 'border-0', 'rounded-0');

    const liElements = type === 'posts' ? generatePosts(data, [...state.uiState.visitedPostsIds]) : generateFeeds(data);

    ulElement.append(...liElements);
    containerBody.append(containerTitle);
    container.append(containerBody, ulElement);
    container.addEventListener('click', (event) => {
      if (['A', 'BUTTON'].includes(event.target.tagName)) {
        const id = Number(event.target.dataset.id);
        state.uiState.visitedPostsIds.add(id);
        state.uiState.modalPostId = id;
      }
    });

    return container;
  };

  const renderModal = (posts, modalPostId) => {
    const modalTitle = elements.modal.querySelector('.modal-title');
    const modalBody = elements.modal.querySelector('.modal-body');
    const readMoreButton = elements.modal.querySelector('.full-article');
    const currentPost = posts.find(({ id }) => id === modalPostId);
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

  const state = onChange(initialState, (path, currentValue) => {
    switch (path) {
      case 'rss.posts':
        elements.posts.innerHTML = '';
        elements.posts.append(generateContainer(currentValue, 'posts', state));
        break;
      case 'rss.feeds':
        elements.feeds.innerHTML = '';
        elements.feeds.append(generateContainer(currentValue, 'feeds', state));
        break;
      case 'uiState.modalPostId':
        renderModal(state.rss.posts, currentValue);
        break;
      case 'uiState.visitedPostsIds':
        renderPostLink(currentValue);
        break;
      case 'form.valid':
        renderForm(state.form);
        break;
      case 'loadingProcess.status':
        loadingProcessHandler(state.loadingProcess);
        break;
      default:
        break;
    }
  });

  return state;
};
