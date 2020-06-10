import { NextFunction, Request, Response } from 'express';
import HttpException from '../exceptions/HttpException';

function errorMiddleware(error: HttpException, request: Request, response: Response, _: NextFunction) {
	const status = error.status || 500;
	const message = error.message || 'Something went wrong';

	response
		.status(status)
		.json({ message, status });

	if (error.cause) {
		throw error.cause
	}
}

export default errorMiddleware;
