import { sendNotification } from 'web-push';
import Subscription from '@/models/Subscription';

class NotificationService {
	private readonly vapidPublicKey: string;
	private readonly vapidPrivateKey: string;
	private readonly vapidEmail: string;

	constructor(vapidPublicKey: string, vapidPrivateKey: string, vapidEmail: string) {
		this.vapidPublicKey = vapidPublicKey;
		this.vapidPrivateKey = vapidPrivateKey;
		this.vapidEmail = vapidEmail;
	}

	// TODO: Debounce notifySubscribers
	async notifySubscribers() {
		(await Subscription.findAll()).forEach((sub) => {
			sendNotification(sub.subscription, null, {
			    TTL: 20,
			    vapidDetails: {
			        subject: `mailto: ${this.vapidEmail}`,
			        publicKey: this.vapidPublicKey,
			        privateKey: this.vapidPrivateKey,
			    }
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
