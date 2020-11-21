let deferredPrompt;
let enableNotifButtons = document.querySelectorAll('.enable-notifications');

if(!window.Promise) {
  window.Promise = Promise;
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then(function() {
      console.log('Service worker registered!');
    })
    .catch(function(err) {
      console.log(err);
    });
}

window.addEventListener('beforeinstallprompt', function(event) {
  event.preventDefault();
  deferredPrompt = event;
  return false;
})

function displayConfirmNotif() {
  if ('serviceWorker' in navigator) {
    const options = {
      body: 'You have subscribed to PDPgram!',
      icon: '/src/images/icons/app-icon-96x96.png',
      image: '/src/images/sf-boat.jpg',
      dir: 'ltr',
      lang: 'en-US',
      vibrate: [100, 50, 200],
      badge: '/src/images/icons/app-icon-96x96.png'
    };
    navigator.serviceWorker.ready
      .then(function(swRegistration) {
        swRegistration.showNotification('Successfully subscribed!', options);
      })
  }
}

function askForNotifPermission() {
  Notification.requestPermission(function(result) {
    console.log('User choice', result);
    if (result !== 'granted') {
      console.log('No notification permission granted');
    } else {
      displayConfirmNotif()
    }
  })
}

if ('Notification' in window) {
  for (let button of enableNotifButtons) {
    button.style.display = 'inline-block';
    button.addEventListener('click', askForNotifPermission);
  }
}