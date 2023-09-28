'use strict';

const storeName = 'localFiles'
const storeKey = 'fileName';
let db = null;

const handleSubmit = async (ev) => {
	ev.preventDefault();
	const file = await getFileFromInput();
	const store = db.transaction(storeName, 'readwrite').objectStore(storeName);
	store.add(file);
};

/**
 * @desc Gets the file from the input field
 * @returns {Promise<object>}
 */
const getFileFromInput = () => {
	return new Promise((resolve, reject) => {
		const file = document.getElementById('file').files[0];
		const reader = new FileReader();
		reader.onload = (event) => {
			resolve({
				[storeKey]: file.name,
				data: event.target.result,
			});
		};
		reader.onerror = (event) => {
			reject(event.target.error);
		};
		reader.readAsArrayBuffer(file);
	});
};

/**
 * @desc Initializes the IndexedDB database
 * @param {string} dbName
 * @param {{name: string, keyPath: string}[]} stores
 * @returns {Promise<IDBDatabase>}
 */
const initIndexedDb = (dbName, stores) => {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(dbName, 1);
		request.onerror = (event) => {
			reject(event.target.error);
		};
		request.onsuccess = (event) => {
			resolve(event.target.result);
		};
		request.onupgradeneeded = (event) => {
			stores.forEach((store) => {
				event.target.result.createObjectStore(store.name, { keyPath: store.keyPath });
			});
		};
	});
};

const renderAvailableImagesFromDb = () => {
  db.transaction(storeName, 'readonly').objectStore(storeName).openCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    console.log(cursor)
    if (cursor) {
      const image = document.createElement('img');
      const imageName = cursor.value[storeKey];
      const imageBuffer = cursor.value.data;
      const imageBlog = new Blob([imageBuffer]);
      image.src = URL.createObjectURL(imageBlog);
      image.title = imageName;
      document.getElementById('images').appendChild(image);
      cursor.continue();
    }
  };
}

document.querySelector('form')?.addEventListener('submit', handleSubmit);

window.addEventListener('load', async () => {
  db = await initIndexedDb('my-db', [{ name: storeName, keyPath: storeKey }]);
  renderAvailableImagesFromDb()
});