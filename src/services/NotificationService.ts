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

		(await Subscription.findAll()).forEach((sub) => {
			sendNotification(sub.subscription, null, {
			    TTL: 20,
			    vapidDetails: {
			        subject: `mailto: ${this.vapidEmail}`,
			        publicKey: this.vapidPublicKey,
			        privateKey: this.vapidPrivateKey,
			    },
			}).catch(error => {
				switch (error.statusCode) {
					/* Delete the subscription if it has 'gone' */
					case 410:
						sub.destroy();
						break;
					default:
						throw error;
				}
			});
		});
	}

}

export default NotificationService;
