import { POLL_HIGH } from 'rpio';
import { cleanEnv, makeValidator, num, str, host, port } from 'envalid';
import * as dotenv from 'dotenv';
import Gpio from '@/Gpio';
import MqttClient from '@/MqttClient';
import WebpackHotModule from "@/interfaces/WebpackHotModule";

/* Define custom ENV validators */
dotenv.config()
const gpioMapping = makeValidator(x => {
	if (x === 'gpio' || x === 'physical') return x;
	throw new Error(`Invalid value for GPIO_MAPPING: ${x}`);
});

/* Validate ENV file */
const env = cleanEnv(process.env, {
	GPIO_MAPPING: gpioMapping(),
	GPIO_BUTTON_PIN: num(),
	GPIO_RELAY_PIN: num(),
	MQTT_HOST: host(),
	MQTT_PORT: port(),
	MQTT_USERNAME: str(),
	MQTT_PASSWORD: str(),
	MQTT_TOPIC_PREFIX: str(),
	DEVICE_ID: str(),
});

/* Open connection to Home Assistant */
const mqtt = await MqttClient.connect(env.MQTT_HOST, env.MQTT_PORT, env.MQTT_USERNAME, env.MQTT_PASSWORD, env.MQTT_TOPIC_PREFIX, env.DEVICE_ID);

/* Start listening to the GPIO */
const gpio = new Gpio(env.GPIO_MAPPING, env.GPIO_BUTTON_PIN, env.GPIO_RELAY_PIN);

gpio.addTask({ direction: POLL_HIGH, task: () => mqtt.press() });

/* Allow the doorbell to be triggered through Home Assistant */
mqtt.onPress(() => {
	gpio.poll(gpio.buttonPin, 0)
	setTimeout(() => {
		gpio.poll(gpio.buttonPin, 1)
	}, 200);
})

/* Dispose of all used resources on process termination */
process.on('SIGINT', async () => {
	console.info('Shutting down...');
	gpio.dispose();
	await mqtt.disconnect();
});

/* Enable Webpack's 'Hot Module Reload' functionality */
declare const module: WebpackHotModule;
if (module.hot) {
	module.hot.accept();
	module.hot.dispose(() => {
		gpio.dispose();
	});
}
