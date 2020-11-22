const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const webPush = require('web-push');
const serviceAccount = require('./pdpgram-firebase-key.json');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://pdpgram.firebaseio.com/'
});

exports.storePost = functions.https.onRequest((request, response) => {
  functions.logger.info("Store new post", {structuredData: true});
  cors(request, response, function () {
    admin.database().ref('posts').push({
      id: request.body.id,
      title: request.body.title,
      location: request.body.location,
      image: request.body.image
    })
      .then(function () {
        webPush.setVapidDetails(
          'mailto:alvarolukmanto@gmail.com',
          'BKVTd2I14_4ucLgG20XcvnT2JxhUbs2CJuMQFEyaD3DJLbnNrdpthAtJtaQr1X2h9KzIRRpUDCCeGczlTxtRHC8',
          'yH4szIb8_tAM9EYhSiAbLF0S9gOXqPpQj0KLfAPKFsE'
        );
        return admin.database().ref('subscriptions').once('value');
      })
      .then(function (subscriptions) {
        subscriptions.forEach(function (sub) {
          webPush.sendNotification(sub.val(), JSON.stringify({
            title: 'New Post',
            content: 'New post added!',
            openUrl: '/help'
          }))
            .catch(function (err) {
              functions.logger.error('Fail to send notification', {
                subscription: sub.val(),
                error: err
              });
            });
        });
        response.status(201).json({ message: 'Post successfully stored', id: request.body.id });
      })
      .catch(function (err) {
        response.status(500).json({ error: err });
      });
  })
});
