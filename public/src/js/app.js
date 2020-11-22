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

function displayConfirmNotification() {
  if ('serviceWorker' in navigator) {
    const options = {
      body: 'You have subscribed to PDPgram!',
      icon: '/src/images/icons/app-icon-96x96.png',
      image: '/src/images/sf-boat.jpg',
      dir: 'ltr',
      lang: 'en-US',
      vibrate: [100, 50, 200],
      badge: '/src/images/icons/app-icon-96x96.png',
      tag: 'confirmation-notification',
      renotify: true,
      actions: [
        {
          action: 'confirm',
          title: 'Okay',
          icon: '/src/images/icons/app-icon-96x96.png'
        },
        {
          action: 'cancel',
          title: 'Cancel',
          icon: '/src/images/icons/app-icon-96x96.png'
        }
      ]
    };
    navigator.serviceWorker.ready
      .then(function(swRegistration) {
        swRegistration.showNotification('Successfully subscribed!', options);
      })
  }
}

function setupPushSubscription() {
  // private and public key generated using web-push package
  const vapidPublicKey = 'BKVTd2I14_4ucLgG20XcvnT2JxhUbs2CJuMQFEyaD3DJLbnNrdpthAtJtaQr1X2h9KzIRRpUDCCeGczlTxtRHC8';
  const publicKeyInUint8 = urlBase64ToUint8Array(vapidPublicKey);
  const subscriptionsUrl = 'https://pdpgram.firebaseio.com/subscriptions.json';
  let reg;

  navigator.serviceWorker.ready
    .then(function(swRegistration) {
      reg = swRegistration;
      return swRegistration.pushManager.getSubscription();
    })
    .then(function(sub) {
      if (!sub) {
        return reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: publicKeyInUint8
        });
      }
    })
    .then(function(newSub) {
      return fetch(subscriptionsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(newSub)
      })
    })
    .then(function(res) {
      if (res.ok) {
        displayConfirmNotification();
      }
    })
    .catch(function(err) {
      console.log(err)
    });
}

function askForNotifPermission() {
  Notification.requestPermission(function(result) {
    console.log('User choice', result);
    if (result !== 'granted') {
      console.log('No notification permission granted');
    } else {
      setupPushSubscription()
    }
  })
}

if ('Notification' in window && 'serviceWorker' in navigator) {
  for (let button of enableNotifButtons) {
    button.style.display = 'inline-block';
    button.addEventListener('click', askForNotifPermission);
  }
}