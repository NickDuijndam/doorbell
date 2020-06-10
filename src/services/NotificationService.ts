import { sendNotification } from 'web-push';
import Subscription from '@/models/Subscription';

class NotificationService {

	// TODO: Debounce notifySubscribers
	static async notifySubscribers() {
		const publicKey = process.env.VAPID_PUBLIC_KEY;
		const privateKey = process.env.VAPID_PRIVATE_KEY;

		if (!publicKey || !privateKey) {
			return;
		}

		(await Subscription.findAll()).forEach((sub) => {
			sendNotification(sub.subscription, null, {
			    TTL: 20,
			    vapidDetails: {
			        subject: `mailto: ${process.env.VAPID_EMAIL}`,
			        publicKey: publicKey,
			        privateKey: privateKey,
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
