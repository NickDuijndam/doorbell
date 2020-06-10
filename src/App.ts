import http from 'http';
import https from 'https';
import path from 'path';
import Umzug from 'umzug';
import express from 'express';
import { Sequelize } from 'sequelize-typescript';
import errorMiddleware from '@/middleware/error';
import Controller from '@/interfaces/Controller';
import Subscription from '@/models/Subscription';

class App {
	enableHttps: boolean = false;
	app: express.Application
	httpServer?: http.Server
	httpsServer?: https.Server

	constructor(controllers: Controller[] = [], enableHttps: boolean = true) {
		this.enableHttps = enableHttps;
		this.app = express();

		this.connectToDatabase();
		if (enableHttps) {
			this.httpsRedirect();
		}
		this.serveStaticFiles();
		this.initializeMiddleware(controllers);
	}

	/**
	 * Listen for incoming http connections on the given port
	 */
	listen() {
		this.httpServer = http.createServer(this.app);
		this.httpServer.listen(process.env.HTTP_PORT, () => {
			console.info(`Listening on port ${process.env.HTTP_PORT}`);
		});

		if (this.enableHttps) {
			//TODO: Add certificates
			this.httpsServer = https.createServer(this.app);
			this.httpsServer.listen(process.env.HTTPS_PORT, () => {
				console.info(`Listening on port ${process.env.HTTPS_PORT}`);
			});
		}
	}

	/**
	 * Setup HTTPS redirection
	 */
	private httpsRedirect() {
		this.app.use(function(req, res, next) {
			if(!req.secure)
				return res.redirect(['https://', req.get('Host'), req.url].join(''));
			next();
		});
	}

	/**
	 * Initialize all express middleware
	 */
	private initializeMiddleware(controllers: Controller[]) {
		this.app.use(express.json());
		controllers.forEach((controller) => {
			this.app.use(`/api${controller.basePath}`, controller.router);
		});

		/* The error middleware should always come last */
		this.app.use(errorMiddleware);
	}

	/**
	 * Serve the static front-end files
	 */
	private serveStaticFiles() {
		this.app.use(express.static('public'));
	}

	/**
	 * Connect to the SQLite database using the location passed to the environment variables
	 */
	private connectToDatabase() {
		if (!process.env.DB_LOCATION) {
			throw Error("Database location not set");
		}

		console.info(`Reading database from ${path.resolve(process.env.DB_LOCATION)}`);
		const sequelize = new Sequelize({
			dialect: 'sqlite',
			models: [Subscription],
			storage: process.env.DB_LOCATION,
		});

		this.runMigrations(sequelize)
	}

	/**
	 * Run the database migrations
	 *
	 * @param sequelize Sequelize instance
	 */
	private runMigrations(sequelize: Sequelize) {
		/* Setup migration library */
		const umzug = new Umzug({
			migrations: {
				path: './migrations',
				params: [ sequelize.getQueryInterface(), sequelize.constructor ]
			},
			storage: 'sequelize',
			storageOptions: { sequelize }
		});

		/* Run migrations */
		(async () => {
			await umzug.up();
			console.log('All migrations performed successfully');
		})();
	}
}

export default App;
