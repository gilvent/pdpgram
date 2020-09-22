const dbPromise = idb.open('posts-store', 1, db => {
  if (!db.objectStoreNames.contains('posts-store')) {
    db.createObjectStore('posts', { keyPath: 'id' });
  }
});

function writeToIndexedDB(storeName, data) {
  return dbPromise.then(db => {
    let transaction = db.transaction(storeName, 'readwrite');
    let store = transaction.objectStore(storeName);
    store.put(data);
    return transaction.complete;
  })
}