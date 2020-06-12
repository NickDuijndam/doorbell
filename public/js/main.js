(() => {
	'use strict';

	let serviceWorkerRegistration = null;
	let isSubscribed = false;

	const serverIP = `${window.location.href}api/`;
	const applicationServerPublicKey = 'BHORLZf_Tnq6j9Mbjd5jse2-zkyRPNWrCNK52A52bblA1YL3CvEiavSeIdAbmJh8LLuNlV8YtX5rButrkdzrDFs';

	const notSupportedMessage = 'This browser does not support push notifications!';
	const notificationBlockedMessage = 'Notifications blocked'

	const subscribeButton = document.querySelector('.subscribe-button');
	const messageDiv = document.querySelector('.message');

	if (!('Notification' in window)) {
		messageDiv.textContent = notSupportedMessage;
		return;
	}

	function requestNotificationPermissions() {
		return Notification.requestPermission(status => {
			console.info('Notification permission status:', status);
		});
	}

	function initializeUI() {
		subscribeButton.addEventListener('click', () => {
			subscribeButton.disabled = true;

			requestNotificationPermissions().then(() => {
				if (!hasPermissions())
					return;

				if (isSubscribed) {
					unsubscribe();
				} else {
					subscribe();
				}
			});
		});

		serviceWorkerRegistration.pushManager.getSubscription()
			.then(subscription => {
				isSubscribed = (subscription !== null);
				updateSubscriptionOnServer(subscription);

				console.info(`User is ${!isSubscribed ? 'not ' : ''}subscribed.`, subscription);
				updateBtn();
			});
	}

	function subscribe() {
		serviceWorkerRegistration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: urlB64ToUint8Array(applicationServerPublicKey),
		})
			.then(subscription => {
				console.info('User is subscribed:', subscription);
				updateSubscriptionOnServer(subscription);
				isSubscribed = true;
				updateBtn();
			})
			.catch(err => {
				if (hasPermissions()) {
					console.error('Failed to subscribe the user: ', err);
				}
				updateBtn();
			});
	}

	function unsubscribe() {
		serviceWorkerRegistration.pushManager.getSubscription()
			.then(subscription => {
				if (subscription) {
					subscription.unsubscribe();
				}
				return subscription
			})
			.catch(err => {
				console.log('Error unsubscribing', err);
			})
			.then(subscription => {
				/* Unsubscribe using the subscription object since we do not track any user information */
				unsubscribeOnServer(subscription);
				console.log('User is unsubscribed');
				isSubscribed = false;
				updateBtn();
			});
	}

	function hasPermissions() {
		if (Notification.permission === 'denied') {
			messageDiv.textContent = notificationBlockedMessage;
			subscribeButton.disabled = true;
			return false
		}

		return true
	}

	function updateBtn() {
		if(!hasPermissions())
			return;

		if (isSubscribed) {
			subscribeButton.textContent = 'Unsubscribe';
		} else {
			subscribeButton.textContent = 'Subscribe';
		}

		subscribeButton.disabled = false;
	}

	function unsubscribeOnServer(subscription) {
		if (!subscription) return;
		serverCall('subscription/unsubscribe', subscription);
	}

	function updateSubscriptionOnServer(subscription) {
		if (!subscription) return;
		serverCall('subscription/subscribe', subscription);
	}

	function serverCall(url, body) {
		return fetch(`${serverIP}${url}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(body)
		}).then(response => {
			if (!response.ok) {
				const data = response.json();

				if (data.status !== 409) {
					messageDiv.textContent = data.message;
				}
			}
		});
	}

	function urlB64ToUint8Array(base64String) {
		const padding = '='.repeat((4 - base64String.length % 4) % 4);
		const base64 = (base64String + padding)
			.replace(/-/g, '+')
			.replace(/_/g, '/');

		const rawData = window.atob(base64);
		const outputArray = new Uint8Array(rawData.length);

		for (let i = 0; i < rawData.length; ++i) {
			outputArray[i] = rawData.charCodeAt(i);
		}
		return outputArray;
	}

	/* Register service worker */
	if ('serviceWorker' in navigator) {
		window.addEventListener('load', () => {
			navigator.serviceWorker.register('service-worker.js')
				.then(reg => {
					serviceWorkerRegistration = reg;
					initializeUI();
				})
				.catch(err => {
					console.error('Service Worker Error', err);
				});
		});
	} else {
		messageDiv.textContent = notSupportedMessage;
	}
})();
