import { Request, Response, NextFunction } from 'express';
import Config from '../config';
const jwt = require('jsonwebtoken');
var session = require('express-session');
// Models
import User, { IUser } from '../models/User';

/*
return res.status(404).json({
    message: 'user not found'
})
return res.status(500).json('Internal Sever Error');
*/

class AuthController {
	//Register
	public async signup(req: Request, res: Response, next: NextFunction) {
		try {
			const { email, password } = req.body; //get data from body

			//Check if user exist
			const existUser = await User.findOne({ email: email }); //find user by email

			if (existUser) {
				console.log('existUser: ', existUser);
				return res.status(400).json({
					//auth:false,
					code: 125,
					error: 'This email is already used'
				});
			}

			const user: IUser = new User({
				email: email,
				password: password
			});
			user.password = await user.encryptPassword(user.password); //apply encrypt password to userSchema
			console.log('Saving user to DB: ', user);
			await user.save(); //save user to db

			//create token
			const token = jwt.sign({ id: user._id }, Config.secret, {
				expiresIn: 60 * 60 * 24 //1 dia
			});
			console.log('Token created: ', token);

			res.header('auth-token', token).json({
				message: 'User Save',
				token: token
			});
		} catch (error) {
			console.log('-----Something was wrong------ \n', error);
			//next(error)
			res.status(500).send({ message: error.message });
		}
	}

	//Start Session
	public async signin(req: Request, res: Response, next: NextFunction) {
		//get user data from db
		const { email, password } = req.body;
		console.log('Post signin ->', req.body);
		const user = await User.findOne({ email: email }); //find user by email
		if (!user) {
			return res.status(400).send({
				//auth:false,
				code: 103,
				error: 'Email or password wrong'
			});
		}

		//validate provided password
		const validPassword = await user.validatePassword(password); //true if password is valid
		console.log(validPassword);
		if (!validPassword) {
			return res.status(400).send({
				code: 103,
				error: 'Email or password wrong'
			});
		}

		//create token
		const token: string = jwt.sign({ id: user._id }, Config.secret, {
			expiresIn: 30 //* 60 * 24 //1 dia
		});
		console.log(token);

		//return token + response
		res.header('Authorization', 'Bearer ' + token).json({
			//auth: true,
			token: token,
			user: user
		});
	}

	public async refreshToken(req: Request, res: Response, next: NextFunction) {
		//App will send token by headers but cannot be saved into it so its saved in sharedPreferences
		//If refreshToken returns 200 all is OK otherwise app will be sent to register/login view
		console.log('-----refreshToken-------');
		const userToken = req.header('auth-token'); //pass token as x-access-token header value
		console.log('oldToken: ', userToken);

		//get user data from db
		const { email, password } = req.body;
		console.log('body ->', req.body);
		const user = await User.findOne({ email: email }); //find user by email
		if (!user) {
			return res.status(400).json({
				auth: false,
				message: 'Invalid email or password'
			});
		}

		//validate provided password
		const validPassword = await user.validateEncriptedsPassword(password); //true if password is valid
		console.log(validPassword);
		if (!validPassword) {
			return res.status(400).json({
				auth: false,
				message: 'Invalid email or password'
			});
		}

		//create token
		const token: string = jwt.sign({ id: user._id }, Config.secret, {
			expiresIn: 60 //* 60 * 24 //1 dia
		});
		console.log('New token: ', token);

		//return token + response
		res
			.status(200)
			.header('auth-token', token)
			.send({ token: token });
	}

	//Get user info by token
	public async me(req: Request, res: Response, next: NextFunction) {
		console.log('-----Me-------');
		const userToken = req.header('auth-token'); //pass token as x-access-token header value
		console.log('userToken: ', userToken);

		console.log('search for userId: ', req.userId);
		const user = await User.findById(req.userId, { password: 0 }); //get user by req.userId (witch is provide for verifyToken middleware) from db except password value
		if (!user) {
			return res.status(404).send('Not user found');
		}

		res.json({
			message: 'user found',
			user
		});
	}

	public login(req: Request, res: Response) {
		if (req.session) {
			const user = req.session.username;

			if (user) {
				res.redirect('/');
			} else {
				res.render('../views/login.hbs', { layout: 'out' });
			}
		}
	}

	public async auth(req: Request, res: Response) {
		var username = req.body.email;
		var password = req.body.pass;
		const user = await User.findOne({ email: username, rol: 1 }); //find user by email
		if (username && password) {
			if (!user) {
				return res.status(400).send({
					//auth:false,
					code: 103,
					error: 'Usuario no registrado'
				});
			} else {
				//validate provided password
				const validPassword = await user.validatePassword(password); //true if password is valid
				console.log(validPassword);
				if (!validPassword) {
					return res.status(400).send({
						code: 103,
						error: 'Email or password wrong'
					});
				} else {
					if (req.session) {
						req.session.loggedin = true;
						req.session.username = username;
						res.redirect('/');
					}
				}
			}
		}
	}
	public logout(req: Request, res: Response) {
		if (req.session) {
			req.session.destroy(function(err) {
				if (err) {
					console.log(err);
				} else {
					console.log(session.username);
					res.redirect('/');
				}
			});
		}
	}

	public async register(req: Request, res: Response) {
		try {
			var username = req.body.email;
			var password = req.body.pass;

			//Check if user exist
			const existUser = await User.findOne({ email: username }); //find user by email

			if (existUser) {
				console.log('existUser: ', existUser);
				return res.status(400).json({
					//auth:false,
					code: 125,
					error: 'This email is already used'
				});
			}

			const user: IUser = new User({
				email: username,
				password: password,
				rol: 1
			});
			user.password = await user.encryptPassword(user.password); //apply encrypt password to userSchema
			console.log('Saving user to DB: ', user);
			await user.save(); //save user to db

			res.redirect('/auth/register');
		} catch (error) {
			console.log('-----Something was wrong------ \n', error);
			//next(error)
			res.status(500).send({ message: error.message });
		}
	}

	public async registerPage(req: Request, res: Response) {
		const users = await User.find({ rol: 1 });
		res.render('../views/registerForm.hbs', { users });
	}
}

export const authController = new AuthController();
