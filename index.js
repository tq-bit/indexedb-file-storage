'use strict';

const storeName = 'localFiles';
const storeKey = 'fileName';
const dbVersion = 1;
let db = null;

// IndexedDB Methods
const initIndexedDb = (dbName, stores) => {
	// TODO: Add code to init the DB
	console.log(dbName, stores)
};

const clearEntriesFromIndexedDb = () => {
	// TODO: Add code to clear the DB
	console.log('Clearing entries from DB')
};

const deleteImageFromIndexedDb = (storeKey) => {
	// TODO: Add code to delete one image
	console.log('Deleting image from DB' + storeKey)
};

const renderAvailableImagesFromDb = () => {
	// TODO: Add code to render the images
	console.log('Rendering images from DB')
};

const handleSearch = async (ev) => {
	ev.preventDefault();
	// TODO: Add code to handle the search
	console.log('Handling search for keyword ' + ev.target[0].value)
};

// Form functions
/**
 * @desc Gets the file from the input field and adds it to the IndexedDB
 * @param {Event} ev
 * @returns {Promise<void>}
 */
const handleSubmit = async (ev) => {
	ev.preventDefault();
	const file = await getFileFromInput();
	const store = db.transaction(storeName, 'readwrite').objectStore(storeName);
	store.add(file);

	store.transaction.oncomplete = () => {
		clearGalleryImages();
		renderAvailableImagesFromDb();
		renderStorageQuotaInfo();
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
				type: file.type,
				size: file.size,
				data: event.target.result,
			});
		};
		reader.onerror = (event) => {
			reject(event.target.error);
		};
		reader.readAsArrayBuffer(file);
	});
};

// Methods for the image gallery

/**
 * @desc Clears the gallery images from the DOM
 */
const clearGalleryImages = () => {
	document.getElementById('images').innerHTML = '';
}

/**
 * @desc Renders the gallery images in the DOM
 * @param {IDBCursorWithValue} cursor
 */
const renderGalleryColumn = (cursor) => {
	const galleryContainer = document.getElementById('images');
	const imageBuffer = cursor.value.data;
	const imageBlog = new Blob([imageBuffer]);

	const col = document.createElement('div');
	col.classList.add('col-12', 'col-md-6', 'col-lg-4');

	const card = document.createElement('div');
	card.classList.add('card');

	const cardBody = document.createElement('div');
	cardBody.classList.add('card-body');

	const image = document.createElement('img');
	image.src = URL.createObjectURL(imageBlog);
	image.classList.add('card-img-top');

	const title = document.createElement('h5');
	title.classList.add('card-title');
	title.innerText = cursor.value['type'];

	const subTitle = document.createElement('h6');
	subTitle.classList.add('card-subtitle');
	subTitle.innerText = formatAsByteString(+cursor.value['size'])

	const text = document.createElement('p');
	text.classList.add('card-text');
	text.innerText = cursor.value[storeKey];

	const deleteButton = document.createElement('button');
	deleteButton.classList.add('btn', 'btn-danger');
	deleteButton.innerText = 'Delete';
	deleteButton.addEventListener('click', () => {
		deleteImageFromIndexedDb(cursor.value[storeKey]);
	})

	cardBody.appendChild(title);
	cardBody.appendChild(subTitle);
	cardBody.appendChild(text)
	cardBody.appendChild(deleteButton);
	card.appendChild(image);
	card.appendChild(cardBody);
	col.appendChild(card);

	galleryContainer.appendChild(col);
}

// Methods for Storage quota
/**
 * @desc Gets the current storage quota
 * @returns {Promise<{totalQuota: string, usedQuota: string, freeQuota: string}>}
 */
const getStorageQuotaText = async () => {
	const estimate = await navigator.storage.estimate();
	const totalQuota = +(estimate.quota || 0);
	const usedQuota = +(estimate.usage || 0);
	const freeQuota = totalQuota - usedQuota;
	return {
		totalQuota: formatAsByteString(totalQuota),
		usedQuota: formatAsByteString(usedQuota),
		freeQuota: formatAsByteString(freeQuota)
	};
};

/**
 * @desc Renders the storage quota info in the DOM
 * @returns {Promise<void>}
 */
const renderStorageQuotaInfo = async () => {
	const { totalQuota, usedQuota, freeQuota } = await getStorageQuotaText();
	document.getElementById('storage-total').textContent = totalQuota;
	document.getElementById('storage-used').textContent = usedQuota;
	document.getElementById('storage-free').textContent = freeQuota;
}

// Util functions
const formatAsByteString = (bytes) => {
	const oneGigabyte = 1024 * 1024 * 1024;
	const oneMegabyte = 1024 * 1024;
	const oneKilobyte = 1024;

	return bytes > oneGigabyte ? `${(bytes / oneGigabyte).toFixed(2)} GB` : bytes > oneMegabyte ? `${(bytes / oneMegabyte).toFixed(2)} MB` : `${(bytes / oneKilobyte).toFixed(2)}KB`;
}


// Init event listeners
document.querySelector('#file-form')?.addEventListener('submit', handleSubmit);
document.querySelector('#search-form')?.addEventListener('submit', handleSearch);
document.querySelector('#clear-button')?.addEventListener('click', clearEntriesFromIndexedDb);

window.addEventListener('load', async () => {
	const persistent = await navigator.storage.persist();
	if (persistent) {
		db = await initIndexedDb('my-db', [{ name: storeName, keyPath: storeKey }]);
		renderAvailableImagesFromDb();
		await renderStorageQuotaInfo();
	} else {
		console.warn('Persistence is not supported');
	}
});