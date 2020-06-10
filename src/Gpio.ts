import rpio from 'rpio';

class Gpio {
	private readonly mock: boolean;
	private SLEEP = 20;

	/* Pin constants in the GPIO button mapping format */
	private BUTTON_PIN = 26;
	private BELL_PIN = 19;

	/* value used to debounce the button press */
	private previousState: number | null = null;
	private tasks: GPIOTask[] = [];

	constructor(mock: boolean = false) {
		this.mock = mock;

		rpio.init({ mapping: 'gpio' });

		rpio.open(this.BUTTON_PIN, rpio.INPUT, rpio.PULL_UP);
		rpio.open(this.BELL_PIN, rpio.OUTPUT, rpio.LOW);

		rpio.poll(this.BUTTON_PIN, this.poll, rpio.POLL_BOTH);
	}

	poll(pin: number) {
		rpio.msleep(this.SLEEP);

		/* use the pin number as a value when mocked */
		const value = !this.mock ? rpio.read(pin) : pin;

		if (this.previousState != null && this.previousState == value) {
			return;
		}

		this.previousState = value;
		// TODO: Debounce bell signal to protect relay
		rpio.write(this.BELL_PIN, value ? rpio.LOW : rpio.HIGH);

		this.tasks.filter((task) =>
			task.direction === rpio.POLL_BOTH ||
			(task.direction === rpio.POLL_HIGH && value === 0) ||
			(task.direction === rpio.POLL_LOW && value === 1)
		).forEach((task) => task.task(value));
	}

	addTask(task: GPIOTask) {
		this.tasks.push(task);
	}

	dispose() {
		rpio.close(this.BUTTON_PIN);
		rpio.close(this.BELL_PIN);
	}
}

export interface GPIOTask {
	direction: number;
	task: (value: number) => void;
}

export default Gpio;
