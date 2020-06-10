import 'dotenv/config';
import { POLL_HIGH } from 'rpio';
import { bool, cleanEnv, email, port, str } from 'envalid';
import App from '@/App';
import Gpio from '@/Gpio';
import WebpackHotModule from '@/interfaces/WebpackHotModule';
import SubscriptionController from '@/controllers/SubscriptionController';
import NotificationService from '@/services/NotificationService';
import Controller from '@/interfaces/Controller';
import GpioController from '@/controllers/GpioController';

/* Validate ENV file */
cleanEnv(process.env, {
	HTTP_PORT: port(),
	HTTPS_PORT: port(),
	HTTPS_ENABLED: bool(),
	DB_LOCATION: str(),
	VAPID_EMAIL: email(),
	VAPID_PUBLIC_KEY: str(),
	VAPID_PRIVATE_KEY: str(),
	GPIO_MOCK: bool(),
});

const GPIO_MOCK = process.env.GPIO_MOCK === 'true';
const HTTPS_ENABLED = process.env.HTTPS_ENABLED === 'true';

/* Start listening to the GPIO */
const gpio = new Gpio(GPIO_MOCK);
gpio.addTask({ direction: POLL_HIGH, task: () => NotificationService.notifySubscribers() });

/* Create controller instances */
const controllers: Controller[] = [
	new SubscriptionController(),
];

/* Setup GPIO mock if enabled */
if (GPIO_MOCK) {
	controllers.push(new GpioController(gpio));
}

/* Setup app */
const app = new App(controllers, HTTPS_ENABLED);

/* Dispose of all used resources on process termination */
process.on('SIGINT', () => {
	gpio.dispose();
});

/* Enable Webpack's 'Hot Module Reload' functionality */
declare const module: WebpackHotModule;
if (module.hot) {
	module.hot.accept();
	module.hot.dispose(() => {
		app.httpServer?.close();
		app.httpsServer?.close();
		gpio.dispose();
	});
}

/* Start the app */
app.listen();
