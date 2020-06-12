import { POLL_HIGH } from 'rpio';
import { cleanEnv, makeValidator, email, num, port, str } from 'envalid';
import App from '@/App';
import Gpio  from '@/Gpio';
import WebpackHotModule from '@/interfaces/WebpackHotModule';
import SubscriptionController from '@/controllers/SubscriptionController';
import NotificationService from '@/services/NotificationService';
import Controller from '@/interfaces/Controller';
import GpioController from '@/controllers/GpioController';

/* Define custom ENV validators */
const gpioMapping = makeValidator(x => {
	if (x === 'gpio' || x === 'physical') return x;
	throw new Error(`Invalid value for GPIO_MAPPING: ${x}`);
});

/* Validate ENV file */
const env = cleanEnv(process.env, {
	HTTP_PORT: port({ default: 8080 }),
	HTTPS_PORT: port({ default: 8443 }),
	HTTPS_PRIVATE_KEY_PATH: str({ default: undefined }),
	HTTPS_CERTIFICATE_PATH: str({ default: undefined }),
	HTTPS_CA_CHAIN_PATH: str({ default: undefined }),
	DB_LOCATION: str(),
	GPIO_MAPPING: gpioMapping(),
	GPIO_BUTTON_PIN: num(),
	GPIO_RELAY_PIN: num(),
	VAPID_EMAIL: email(),
	VAPID_PUBLIC_KEY: str(),
	VAPID_PRIVATE_KEY: str(),
});

/* Start listening to the GPIO */
const gpio = new Gpio(env.GPIO_MAPPING, env.GPIO_BUTTON_PIN, env.GPIO_RELAY_PIN);
const notificationService = new NotificationService(env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY, env.VAPID_EMAIL);
gpio.addTask({ direction: POLL_HIGH, task: () => notificationService.notifySubscribers() });

/* Create controller instances */
const controllers: Controller[] = [
	new SubscriptionController(),
];

/* Setup GPIO mock if the app is running in development mode */
if (process.env.NODE_ENV === 'development') {
	console.info('Registering mock gpio endpoints');
	controllers.push(new GpioController(gpio));
}

/* Setup app */
const app = new App(controllers, {
	dbLocation: env.DB_LOCATION,
	http: {
		port: env.HTTP_PORT,
	},
	https: {
		port: env.HTTPS_PORT,
		privateKeyPath: env.HTTPS_PRIVATE_KEY_PATH,
		certificatePath: env.HTTPS_CERTIFICATE_PATH,
		caChainPath: env.HTTPS_CA_CHAIN_PATH,
	}
});

/* Dispose of all used resources on process termination */
process.on('SIGINT', () => {
	console.info('Shutting down...');
	gpio.dispose();
	app.close();
	process.exit(1);
});

/* Enable Webpack's 'Hot Module Reload' functionality */
declare const module: WebpackHotModule;
if (module.hot) {
	module.hot.accept();
	module.hot.dispose(() => {
		gpio.dispose();
		app.close();
	});
}

/* Start the app */
app.listen();
