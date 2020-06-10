import { Router, Request, Response, NextFunction } from 'express';
import Subscription from '@/models/Subscription';
import Controller from '@/interfaces/Controller';
import AlreadyExistsException from '@/exceptions/AlreadyExistsException';
import HttpException from '@/exceptions/HttpException';
import { Op } from 'sequelize';
import NotificationService from '@/services/NotificationService';

class SubscriptionController implements Controller {
	public basePath = '/subscription';
	public router = Router();

	constructor() {
		this.router.post('/subscribe', this.subscribe);
		this.router.post('/unsubscribe', this.unsubscribe);
	}

	private subscribe = async (req: Request, res: Response, next: NextFunction) => {
		try {
			await Subscription.create({
				subscription: req.body as string,
			});

			res.status(201).json();
		} catch (e) {
			if (e.name === 'SequelizeUniqueConstraintError') {
				return next(new AlreadyExistsException('Subscription'));
			}

			next(new HttpException().withCause(e));
		}
	};

	private unsubscribe = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const rows = await Subscription.destroy({
				where: {
					subscription: { [Op.like]: req.body }
				}
			});

			if (rows) {
				res.sendStatus(204);
			} else {
				res.status(404).json();
			}
		} catch (e) {
			next(new HttpException().withCause(e));
		}
	};
}

export default SubscriptionController
