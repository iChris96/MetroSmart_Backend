import express from 'express';
import morgan from 'morgan'; //listening http events
import expressHandlebars from 'express-handlebars';
import path from 'path'; //path join folders routes independently be linux or windows path
import multer from 'multer';
import Config from './config';
import session from 'express-session';

//ROUTES
import indexRoutes from './routes';
import tasksRoutes from './routes/tasks';
import jsonRoutes from './routes/json';
import authRoutes from './routes/auth';
import stopsRoutes from './routes/stops';
import csvRoutes from './routes/csv';
import astarRoutes from './routes/astar';
import knnRoutes from './routes/knn';

const storage = multer.diskStorage({
	destination: path.join(__dirname, 'public/uploads'),
	filename: (req, file, cb) => {
		cb(null, file.originalname);
	}
});

class Application {
	app: express.Application;

	constructor() {
		this.app = express();
		//trigger functions when Application object is created
		this.settings();
		this.middlewares();
		this.routes();
	}

	settings() {
		//variables
		this.app.set('port', Config.port); //its like a variable into app object
		this.app.set('views', path.join(__dirname, 'views')); //__dirname -> actual directory //now node knows where /views directory is localized

		//handlebars
		//set engine
		this.app.engine(
			'.hbs',
			expressHandlebars({
				layoutsDir: path.join(this.app.get('views'), 'layouts'),
				partialsDir: path.join(this.app.get('views'), 'partials'),
				defaultLayout: 'main', //html container for all views
				extname: '.hbs'
			})
		);
		//use engine
		this.app.set('view engine', '.hbs');
	}

	middlewares() {
		this.app.use(morgan('dev'));
		this.app.use(express.json()); //app understands json
		this.app.use(express.urlencoded({ extended: true })); //html form data interpreter
		this.app.use(
			multer({
				storage,
				dest: path.join(__dirname, 'public/uploads')
			}).single('hola')
		);
		this.app.use(session({
			secret: 'secret',
			resave: true,
			saveUninitialized: true
		}));
	}

	routes() {
		this.app.use(indexRoutes);
		this.app.use('/tasks', tasksRoutes);
		this.app.use('/json', jsonRoutes); // rutas de json
		this.app.use('/auth', authRoutes);
		this.app.use('/stops', stopsRoutes);
		this.app.use(express.static(path.join(__dirname, 'public'))); //server knows public folder
		this.app.use('/csv', csvRoutes);
		this.app.use('/', astarRoutes);
		this.app.use('/knn', knnRoutes);
	}

	start() {
		this.app.listen(this.app.get('port'), () => {
			console.log('App on port ', this.app.get('port'));
		});
	}
}

export default Application;
