var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var sharedMomentsArea = document.querySelector('#shared-moments');
var form = document.querySelector('form');
var titleInput = document.querySelector('#title');
var locationInput = document.querySelector('#location');
var videoPlayer = document.querySelector('#player');
var canvasElement = document.querySelector('#canvas');
var captureButton = document.querySelector('#capture-btn');
var imagePicker = document.querySelector('#image-picker');
var imagePickerArea = document.querySelector('#pick-image');

function initializeMedia() {
  if (!('mediaDevices' in navigator)) {
    navigator.mediaDevices = {};
  }
  // polyfill getUserMedia
  if (!('getUserMedia' in navigator.mediaDevices)) {
    navigator.mediaDevices.getUserMedia = function (constraints) {
      let getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
      if (!getUserMedia) {
        return Promise.reject(new Error('getUserMedia is not implemented!'));
      }

      return new Promise(function (resolve, reject) {
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
    }
  }
}

function openCreatePostModal() {
  createPostArea.style.display = 'block';
  setTimeout(() => {
    createPostArea.style.transform = 'translateY(0)';
    initializeMedia();
  }, 1);
  
  if (deferredPrompt) {
    deferredPrompt.prompt();

    deferredPrompt.userChoice.then(function(choiceResult) {
      console.log(choiceResult.outcome);

      if (choiceResult.outcome === 'dismissed') {
        console.log('User cancelled installation');
      } else {
        console.log('User added to home screen');
      }
    });

    deferredPrompt = null;
  }

  // if ('serviceWorker' in navigator) {
  //   navigator.serviceWorker.getRegistrations()
  //     .then(registrations => {
  //       for(let registration of registrations) {
  //         registration.unregister();
  //       }
  //     })
  // }
}

function closeCreatePostModal() {
  createPostArea.style.transform = 'translateY(100vh)';
  setTimeout(() => {
    createPostArea.style.display = 'none';
  }, 300)
}

shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

// Currently not in use, allows to save assets in cache on demand otherwise
function onSaveButtonClicked(event) {
  console.log('clicked');
  if ('caches' in window) {
    caches.open('user-requested')
      .then(function(cache) {
        cache.add('https://httpbin.org/get');
        cache.add('/src/images/sf-boat.jpg');
      });
  }
}

function clearCards() {
  while(sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
}

function createCard(data) {
  var cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
  var cardTitle = document.createElement('div');
  cardTitle.className = 'mdl-card__title';
  cardTitle.style.backgroundImage = `url('${data.image}')`;
  cardTitle.style.backgroundSize = 'cover';
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.style.color = 'white';
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = data.title;
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement('div');
  cardSupportingText.className = 'mdl-card__supporting-text';
  cardSupportingText.textContent = data.location;
  cardSupportingText.style.textAlign = 'center';
  // var cardSaveButton = document.createElement('button');
  // cardSaveButton.textContent = 'Save';
  // cardSaveButton.addEventListener('click', onSaveButtonClicked);
  // cardSupportingText.appendChild(cardSaveButton);
  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

function updateUI(data) {
  clearCards();
  for (let d of data) {
    createCard(d);
  }
}

let url = 'https://pdpgram.firebaseio.com/posts.json';
let isFetchedNetworkData = false;

fetch(url)
  .then(function(res) {
    return res.json();
  })
  .then(function(data) {
    isFetchedNetworkData = true;
    console.log('From web', data);
    const dataArray = Object.keys(data).reduce((arr, dataKey) => {
      return [...arr, data[dataKey]];
    }, []);
    updateUI(dataArray);
  });


if ('indexedDB' in window) {
  readFromIndexedDB('posts')
    .then(data => {
      if (!isFetchedNetworkData) {
        console.log('From cache', data);
        updateUI(data);
      }
    })
}

function savePostData(data) {
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(data)
  }).then(function(res) {
    console.log('Sent data', res);
    updateUI()
  })
}

form.addEventListener('submit', function(event) {
  event.preventDefault();
  const title = titleInput.value;
  const location = locationInput.value;
  
  if (title.trim() === '' || location.trim() === '') {
    alert('Please fill title and location');
    return;
  }
  
  closeCreatePostModal();

  let dummyImage = 'https://firebasestorage.googleapis.com/v0/b/pdpgram.appspot.com/o/Merdeka_Square_Monas_02.jpg?alt=media&token=e40326cb-2bba-4290-aa7b-cc8062d63aa4';
  let post = {
    id: new Date().toISOString(),
    title,
    location,
    image: dummyImage
  };

  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready
      .then(function(sw) {

        writeToIndexedDB('sync-posts', post)
          .then(function() {
            sw.sync.register('sync-new-posts');
          })
          .then(function() {
            let snackbarContainer= document.querySelector('#confirmation-toast');
            let data = { message: 'Your post was saved for syncing!' };
            snackbarContainer.MaterialSnackbar.showSnackbar(data);
          }).catch(function(err) {
            console.log(err);
          });
      });
  } else {
    savePostData(post)
  }
})

