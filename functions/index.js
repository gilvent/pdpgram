const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

const serviceAccount = require('./pdpgram-firebase-key.json');

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
        response.status(201).json({ 
          message: 'Successfully store new post',
          id: request.body.id
        });
      })
      .catch(function (err) {
        response.status(500).json({ error: err });
      });
  })
});
