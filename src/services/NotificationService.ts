import { sendNotification } from 'web-push';
import Subscription from '@/models/Subscription';

class NotificationService {
	private readonly vapidPublicKey: string;
	private readonly vapidPrivateKey: string;
	private readonly vapidEmail: string;

	private lastTimeTriggered?: number = undefined

	constructor(vapidPublicKey: string, vapidPrivateKey: string, vapidEmail: string) {
		this.vapidPublicKey = vapidPublicKey;
		this.vapidPrivateKey = vapidPrivateKey;
		this.vapidEmail = vapidEmail;
	}

	async notifySubscribers() {
		const time = new Date().getTime();
		if (this.lastTimeTriggered && time - this.lastTimeTriggered < 15000) {
			this.lastTimeTriggered = time;
			return;
		}
		this.lastTimeTriggered = time;

		for (const sub of (await Subscription.findAll())) {
			try {
				const result = await sendNotification(sub.subscription, null, {
					TTL: 20,
					vapidDetails: {
						subject: `mailto: ${this.vapidEmail}`,
						publicKey: this.vapidPublicKey,
						privateKey: this.vapidPrivateKey,
					},
				});

				if (result.statusCode != 201) {
					console.warn(`Encountered unexpected status code sending a notification : ${result.statusCode}`, result)
				}
			} catch (e) {
				switch (e.statusCode) {
					/* Delete the subscription if it has 'gone' */
					case 410:
						sub.destroy();
						break;
					default:
						console.error(`An error occured whilst sending a notification`, e)
				}
			}


		}
	}

}

export default NotificationService;
