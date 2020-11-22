const dbPromise = idb.open('posts-store', 1, db => {
  if (!db.objectStoreNames.contains('posts-store')) {
    db.createObjectStore('posts', { keyPath: 'id' });
  }
  if (!db.objectStoreNames.contains('sync-posts')) {
    db.createObjectStore('sync-posts', { keyPath: 'id' });
  }
});

function writeToIndexedDB(storeName, data) {
  return dbPromise.then(db => {
    let transaction = db.transaction(storeName, 'readwrite');
    let store = transaction.objectStore(storeName);
    store.put(data);
    return transaction.complete;
  });
}

function readFromIndexedDB(storeName) {
  return dbPromise.then(db => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    return store.getAll();
  });
}

function clearIndexedDBData(storeName) {
  return dbPromise.then(db => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    store.clear();
    return transaction.complete;  
  })
}

function deleteIndexedDBData(storeName, id) {
  return dbPromise
    .then(db => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      store.delete(id);
      return transaction.complete;  
    })
    .then(() => {
      console.log('Item deleted from IndexedDB');
    })
}

function urlBase64ToUint8Array(base64String) {
  var padding = '='.repeat((4 - base64String.length % 4) % 4);
  var base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  var rawData = window.atob(base64);
  var outputArray = new Uint8Array(rawData.length);

  for (var i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}