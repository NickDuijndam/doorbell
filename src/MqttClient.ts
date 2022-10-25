import * as mqtt from 'async-mqtt'

class MqttClient {

	client: mqtt.IMqttClient
	deviceId: string

	private readonly pressConfigTopic: string
	private readonly pressCommandTopic: string

	constructor(client: mqtt.IMqttClient, topicPrefix: string, deviceId: string) {
		this.client = client
		this.deviceId = deviceId

		this.pressConfigTopic = `${topicPrefix}/device_automation/${deviceId}/press/config`
		this.pressCommandTopic = `${topicPrefix}/device_automation/${deviceId}/press/action`
	}

	async press() {
		try {
			await this.client.publish(this.pressCommandTopic, 'PRESS')
		} catch (e) {
			console.error(e)
			process.exit(1)
		}
	}

	onPress(callback: () => void) {
		this.client.on('message', (topic, message) => {
			if (topic === this.pressCommandTopic) {
				callback()
			}
		})
	}

	async publishDiscoveryMessages() {
		try {
			/* Publish button discovery message */
			await this.client.publish(this.pressConfigTopic, JSON.stringify({
				automation_type: 'trigger',
				device: {
					name: 'Doorbell',
					identifiers: [ this.deviceId ],
				},
				name: 'Doorbell',
				icon: 'mdi:doorbell',
				unique_id: `${this.deviceId}_button`,
				topic: this.pressCommandTopic,
				type: 'action',
				subtype: 'press',
				payload: 'PRESS',
			}), { retain: false });

			/* Subscribe to command topic, so we can receive messages from pressing the doorbell in home assistant */
			await this.client.subscribe(this.pressCommandTopic, { qos : 1, nl: true })
		} catch (e) {
			console.error("An error occurred sending discovery messages", e)
			process.exit(1)
		}
	}

	async disconnect() {
		await this.client.end()
	}

	static async connect(host: string, port: number, username: string, password: string, topicPrefix: string, deviceId: string): Promise<MqttClient> {
		const client = new MqttClient(mqtt.connect({
			host: host,
			port: port,
			username: username,
			password: password,
			protocolVersion: 5,
		}), topicPrefix, deviceId)

		await client.publishDiscoveryMessages()

		console.info('Connected to MQTT server.');
		return client
	}

}

export default MqttClient;
