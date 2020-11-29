const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const webPush = require('web-push');
const serviceAccount = require('./pdpgram-firebase-key.json');
const fs = require('fs');
const UUID = require('uuid-v4');
const os = require("os");
const Busboy = require("busboy");
const path = require('path');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

const googleCloudConfig = {
  projectId: 'pdpgram',
  keyFilename: 'pdpgram-firebase-key.json'
};
const gcs = require('@google-cloud/storage')(googleCloudConfig);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://pdpgram.firebaseio.com/'
});

exports.storePost = functions.https.onRequest((request, response) => {
  functions.logger.info('Store new post', {structuredData: true});
  cors(request, response, () => {

    const uuid = UUID();
    const busboy = new Busboy({ headers: request.headers });

    // These objects will store the values (file + fields) extracted from busboy
    let upload;
    const fields = {};

    // This callback will be invoked for each file uploaded
    busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
      console.log(
        `File [${fieldname}] filename: ${filename}, encoding: ${encoding}, mimetype: ${mimetype}`
      );
      const filepath = path.join(os.tmpdir(), filename);
      upload = { file: filepath, type: mimetype };
      file.pipe(fs.createWriteStream(filepath));
    });
    
    // This will invoked on every field detected
    busboy.on('field', (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) => {
      fields[fieldname] = val;
    });

    // This callback will be invoked after all uploaded files are saved.
    busboy.on('finish', () => {
      const bucket = gcs.bucket('pdpgram.appspot.com');
      bucket.upload(
        upload.file,
        {
          uploadType: "media",
          metadata: {
            metadata: {
              contentType: upload.type,
              firebaseStorageDownloadTokens: uuid
            }
          }
        },
        function(err, uploadedFile) {
          if (!err) {
            const imageUrl = 'https://firebasestorage.googleapis.com/v0/b/' + bucket.name +
              '/o/' + encodeURIComponent(uploadedFile.name) + '?alt=media&token=' + uuid;
            admin
              .database()
              .ref('posts')
              .push({
                id: fields.id,
                title: fields.title,
                location: fields.location,
                image: imageUrl,
                rawLocation: {
                  lat: fields.rawLocationLat,
                  lng: fields.rawLocationLng
                }
              })
              .then(function() {
                webPush.setVapidDetails(
                  'mailto:alvarolukmanto@gmail.com',
                  'BKVTd2I14_4ucLgG20XcvnT2JxhUbs2CJuMQFEyaD3DJLbnNrdpthAtJtaQr1X2h9KzIRRpUDCCeGczlTxtRHC8',
                  'yH4szIb8_tAM9EYhSiAbLF0S9gOXqPpQj0KLfAPKFsE'
                );
                return admin.database().ref('subscriptions').once('value');
              })
              .then(function(subscriptions) {
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
                response.status(201).json({ message: 'Post successfully stored', id: fields.id });
              })
              .catch(function(err) {
                response.status(500).json({ error: err });
              });
          } else {
            console.log(err);
          }
        }
      )
    });

    // The raw bytes of the upload will be in request.rawBody.  Send it to busboy, and get
    // a callback when it's finished.
    busboy.end(request.rawBody);

  })
});
