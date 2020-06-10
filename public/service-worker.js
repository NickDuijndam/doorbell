self.addEventListener('push', event => {
	event.waitUntil(
		self.registration.showNotification('Ding Dong!', {
			body: 'Someone is at the door!',
			icon: 'images/door.png',
			vibrate: [100, 50, 100],
			data: {
				dateOfArrival: Date.now(),
				primaryKey: 1,
			},
		})
	)
});
