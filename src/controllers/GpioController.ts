import { Router, Request, Response } from 'express';
import Gpio from '@/Gpio';
import Controller from '@/interfaces/Controller';

class GpioController implements Controller {
	public basePath = '/mock';
	public router = Router();

	private gpio: Gpio

	constructor(gpio: Gpio) {
		this.gpio = gpio;
		this.router.post('/button/:value', this.setButton);
	}

	private setButton = async (req: Request, res: Response) => {
		this.gpio.poll(this.gpio.buttonPin, parseInt(req.params['value']) === 1 ? 0 : 1);
		res.sendStatus(204);
	};
}

export default GpioController
