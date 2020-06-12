import fs from 'fs';
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
	private readonly app: express.Application;
	private readonly appOptions: AppOptions;
	private httpServer?: http.Server;
	private httpsServer?: https.Server;

	constructor(controllers: Controller[], options: AppOptions) {
		this.app = express();
		this.appOptions = options;

		this.connectToDatabase(options.dbLocation);
		if (options.https?.port && options.https?.privateKeyPath && options.https?.certificatePath) {
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
		this.httpServer.listen(this.appOptions.http.port, () => {
			console.info(`Listening on port ${this.appOptions.http.port}`);
		});

		const httpsPort = this.appOptions.https?.port;
		if (httpsPort && this.appOptions.https?.privateKeyPath && this.appOptions.https?.certificatePath) {
			const credentials = {
				key: this.appOptions.https?.privateKeyPath ? fs.readFileSync(this.appOptions.https?.privateKeyPath, 'utf8') : undefined,
				cert: this.appOptions.https?.certificatePath ? fs.readFileSync(this.appOptions.https?.certificatePath, 'utf8') : undefined,
				ca: this.appOptions.https?.caChainPath ? fs.readFileSync(this.appOptions.https?.caChainPath, 'utf8') : undefined,
			};

			this.httpsServer = https.createServer(credentials, this.app);
			this.httpsServer.listen(httpsPort, () => {
				console.info(`Listening on port ${httpsPort}`);
			});
		}
	}

	/**
	 * Close webserver
	 */
	close() {
		this.httpServer?.close();
		this.httpsServer?.close();
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
	 * Connect to the SQLite database using the given location
	 */
	private connectToDatabase(dbLocation: string) {
		console.info(`Reading database from ${path.resolve(dbLocation)}`);
		const sequelize = new Sequelize({
			dialect: 'sqlite',
			models: [Subscription],
			storage: dbLocation,
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

export interface AppOptions {
	dbLocation: string;
	http: {
		port: number;
	};
	https?: {
		port?: number;
		privateKeyPath?: string;
		certificatePath?: string;
		caChainPath?: string;
	}
}

export default App;
