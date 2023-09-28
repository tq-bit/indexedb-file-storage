'use strict';

let db = null;

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
				fileName: file.name,
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
  db.transaction('localFiles', 'readonly').objectStore('localFiles').openCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    console.log(cursor)
    if (cursor) {
      const image = document.createElement('img');
      const imageName = cursor.value.fileName;
      const imageBuffer = cursor.value.data;
      const imageBlog = new Blob([imageBuffer]);
      image.src = URL.createObjectURL(imageBlog);
      image.title = imageName;
      document.getElementById('images').appendChild(image);
      cursor.continue();
    }
  };
}

const handleSubmit = async (ev) => {
	ev.preventDefault();
	const file = await getFileFromInput();
	const store = db.transaction('localFiles', 'readwrite').objectStore('localFiles');
	store.add(file);
};

document.querySelector('form')?.addEventListener('submit', handleSubmit);

(async () => {
	db = await initIndexedDb('my-db', [{ name: 'localFiles', keyPath: 'fileName' }]);
})();

window.addEventListener('load', renderAvailableImagesFromDb);