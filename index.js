'use strict';

const storeName = 'localFiles';
const storeKey = 'fileName';
let db = null;

// Methods for Storage quota
const getStorageQuotaText = async () => {
  const oneGigabyte = 1024 * 1024 * 1024;
  const oneMegabyte = 1024 * 1024;
  const oneKilobyte = 1024;
	const estimate = await navigator.storage.estimate();
  console.log(estimate)
	const totalQuota = +(estimate.quota || 0);
	const usedQuota = +(estimate.usage || 0);
  const freeQuota = totalQuota - usedQuota;
	return {
    totalQuota: totalQuota > oneGigabyte ? `${(totalQuota / oneGigabyte).toFixed(2)} GB` : totalQuota > oneMegabyte ? `${(totalQuota / oneMegabyte).toFixed(2)} MB` : `${(totalQuota / oneKilobyte).toFixed(2)}KB`,
    usedQuota: usedQuota > oneGigabyte ? `${(usedQuota / oneGigabyte).toFixed(2)} GB` : usedQuota > oneMegabyte ? `${(usedQuota / oneMegabyte).toFixed(2)} MB` : `${(usedQuota / oneKilobyte).toFixed(2)}KB`,
    freeQuota: freeQuota > oneGigabyte ? `${(freeQuota / oneGigabyte).toFixed(2)} GB` : freeQuota > oneMegabyte ? `${(freeQuota / oneMegabyte).toFixed(2)} MB` : `${(freeQuota / oneKilobyte).toFixed(2)}KB`,
	};
};

const renderStorageQuotaInfo = async () => {
  const { totalQuota, usedQuota, freeQuota } = await getStorageQuotaText();
  document.getElementById('storage-total').textContent = totalQuota;
  document.getElementById('storage-used').textContent = usedQuota;
  document.getElementById('storage-free').textContent = freeQuota;
}

// Methods for form buttons and file input
const handleSubmit = async (ev) => {
	ev.preventDefault();
	const file = await getFileFromInput();
	const store = db.transaction(storeName, 'readwrite').objectStore(storeName);
	store.add(file);

	store.transaction.oncomplete = () => {
		clearPreviousImages();
		renderAvailableImagesFromDb();
    renderStorageQuotaInfo()
	};
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
			document.getElementById('file').value = '';
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

const clearEntriesFromIndexedDb = () => {
	db.transaction(storeName, 'readwrite').objectStore(storeName).clear();
	clearPreviousImages();

  renderStorageQuotaInfo();
};

// IndexedDB Methods
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
		if (cursor) {
			const imageBuffer = cursor.value.data;
			const imageBlog = new Blob([imageBuffer]);

			const col = document.createElement('div');
			col.classList.add('col-4');

			const card = document.createElement('div');
			card.classList.add('card');

			const image = document.createElement('img');
			image.src = URL.createObjectURL(imageBlog);
			image.classList.add('card-img-top');

			const title = document.createElement('h5');
			title.classList.add('card-title');
			title.innerText = cursor.value[storeKey];

			card.appendChild(image);
			card.appendChild(title);
			col?.appendChild(card);

			document.getElementById('images').appendChild(col);
			cursor.continue();
		}
	};
};

const clearPreviousImages = () => {
	document.getElementById('images').innerHTML = '';
};

// Init event listeners
document.querySelector('form')?.addEventListener('submit', handleSubmit);
document.querySelector('#clear-button')?.addEventListener('click', clearEntriesFromIndexedDb);

window.addEventListener('load', async () => {
	db = await initIndexedDb('my-db', [{ name: storeName, keyPath: storeKey }]);
	renderAvailableImagesFromDb();
  await renderStorageQuotaInfo()
});
