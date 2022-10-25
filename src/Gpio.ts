import rpio from 'rpio';

class Gpio {
	private SLEEP = 50;

	buttonPin: number;
	relayPin: number;

	/* value used to debounce the button press */
	private previousState: number | null = null;
	private tasks: GpioTask[] = [];

	private lastPeriodTriggered?: number = undefined
	private amountOfTimesTriggered: number = 0;

	constructor(mapping: GpioMapping, buttonPin: number, relayPin: number) {
		rpio.init({ mapping });

		this.buttonPin = buttonPin;
		this.relayPin = relayPin;

		rpio.open(this.buttonPin, rpio.INPUT, rpio.PULL_UP);
		rpio.open(this.relayPin, rpio.OUTPUT, rpio.LOW);

		rpio.poll(this.buttonPin, this.poll.bind(this), rpio.POLL_BOTH);
	}

	poll(pin: number, mockValue?: number) {
		rpio.msleep(this.SLEEP);

		const value = mockValue === undefined ? rpio.read(pin) : mockValue;

		if (this.previousState != null && this.previousState == value) {
			return;
		}

		this.previousState = value;
		const time = new Date().getTime();
		if (!this.lastPeriodTriggered || time - this.lastPeriodTriggered >= 60000) {
			this.lastPeriodTriggered = time;
			this.amountOfTimesTriggered = 1;
		} else {
			this.amountOfTimesTriggered += 1;
		}

		/* Disable the relay if it has been activated more than 7 times in the last minute */
		if (this.amountOfTimesTriggered < 15) {
			console.debug(`Writing ${value} ${value ? rpio.LOW + ' LOW' : rpio.HIGH + ' HIGH'} to relay pin`);
			rpio.write(this.relayPin, value ? rpio.LOW : rpio.HIGH);
		}

		this.tasks.filter((task) =>
			task.direction === rpio.POLL_BOTH ||
			(task.direction === rpio.POLL_HIGH && value === 0) ||
			(task.direction === rpio.POLL_LOW && value === 1)
		).forEach((task) => task.task(value));
	}

	addTask(task: GpioTask) {
		this.tasks.push(task);
	}

	dispose() {
		rpio.close(this.buttonPin);
		rpio.close(this.relayPin);
	}
}

export type GpioMapping = 'gpio' | 'physical';

export interface GpioTask {
	direction: number;
	task: (value: number) => void;
}

export default Gpio;
