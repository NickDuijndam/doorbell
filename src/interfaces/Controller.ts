import { Router } from 'express';

interface Controller {
	basePath: string;
	router: Router;
}

export default Controller;
