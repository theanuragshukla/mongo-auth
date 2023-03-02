const Validator = require("./validator");
const crypto = require("crypto");
const { userSchema, resetPasswordSchema } = require("./model");
const bcrypt = require("bcryptjs");
const saltRounds = 10;
const mailer = require('nodemailer');
const {resetPasswordMarkup, passwordChanged} = require("./markup");
const findErrorInObj = (obj) => {
	for (let key in Object.keys(obj)) {
		if (obj[key] === false)
			return {
				isError: true,
				key: key,
			};
	}
	return { isError: false };
};
const defaultSchema = {
	seperateNames: true,
	fullName: {
		min: 5,
		max: 50,
		required: true,
	},
	firstName: {
		min: 3,
		max: 50,
		required: true,
	},
	lastName: {
		min: 3,
		max: 50,
		required: false,
	},

	email: {
		required: true,
	},
	password: {
		min: 8,
		max: 50,
		required: {
			lowercase: false,
			uppercase: false,
			number: false,
			symbol: false,
		},
	},
};

class Auth {
	constructor( mongoURL,schema=defaultSchema, ROOT="http://localhost:3000", NEW_PASSWORD_ENDPOINT ="/reset-password",){
		if(schema){
			console.log('schema')
			const newSchema = {...this.schema, ...schema}
			this.schema = newSchema
			this.validator = new Validator({ schema:newSchema });
		}
		if(ROOT){
			console.log('root')
			this.ROOT = ROOT
		}
		if(NEW_PASSWORD_ENDPOINT){
		console.log('new pass')
			this.NEW_PASSWORD_ENDPOINT = NEW_PASSWORD_ENDPOINT
		}
		if(mongoURL){
		console.log('mongo url')
			this.mongoURL = mongoURL
			this.conn = require("./connection")(mongoURL);
		}
	}



	config({appName, schema, ROOT,  NEW_PASSWORD_ENDPOINT,mongoURL,mailer:{service, email, password}}){
		if(appName){
			this.appName = appName
		}
		if(schema){
			const newSchema = {...this.schema, ...schema}
			this.schema = newSchema
			this.validator = new Validator({ schema:newSchema });
		}
		if(ROOT){
			this.ROOT = ROOT
		}
		if(NEW_PASSWORD_ENDPOINT){
			this.NEW_PASSWORD_ENDPOINT = NEW_PASSWORD_ENDPOINT
		}
		if(mongoURL){
			this.mongoURL = mongoURL
			this.conn = require("./connection")(mongoURL);
		}
		if(service && email && password){
			this.mailer = mailer
			this.sender = mailer.createTransport({
				service: service,
				auth: {
					user: email,
					pass: password,
				},
			});


		}else if(!service || !email || !password){

		}
	}

 sendMail({email, subject, html}){
  const options = {
      from: this.mailer.email,
      to: email,
      subject: subject,
      html: `${html}`,
    };
    this.sender.sendMail(options, (err, data) => {
      if (err) {
        console.log(err);
      } else {
        console.log(`email sent to ${email}`);
      }
    });

 }
	async login({ password, email }) {
		const validStatus = {
			isError: false,
			errorInKey: null,
		};
		const errors = this.validator.validate({ signup: false, email, password });
		for (let key in errors) {
			if (typeof errors[key] === "boolean" && errors[key] === false) {
				validStatus.errorInKey = key;
				validStatus.isError = true;
				break;
			} else if (typeof errors[key] === "object") {
				const errorInfo = findErrorInObj(errors[key]);
				if (errorInfo.isError === true) {
					validStatus.errorInKey = errorInfo.key;
					validStatus.isError = true;
					break;
				}
			}
		}
		if (validStatus.isError) {
			//determine error message and return
			return;
		}
		const exists = await userSchema.findOne({ email });
		console.log(exists);
		if (!exists) {
			return { status: false, msg: "Wrong email or password" };
		} else {
			const match = await bcrypt.compare(password, exists.password);
			if (match) {
				return exists;
			} else {
				return { status: false, msg: "wrong username or password" };
			}
		}
	}

	async signup({ fullName, firstName, lastName, password, email }) {
		const validStatus = {
			isError: false,
			errorInKey: null,
		};
		const errors = this.validator.validate({
			fullName,
			firstName,
			lastName,
			email,
			password,
		});
		for (let key in errors) {
			if (typeof errors[key] === "boolean" && errors[key] === false) {
				validStatus.errorInKey = key;
				validStatus.isError = true;
				break;
			} else if (typeof errors[key] === "object") {
				const errorInfo = findErrorInObj(errors[key]);
				if (errorInfo.isError === true) {
					validStatus.errorInKey = errorInfo.key;
					validStatus.isError = true;
					break;
				}
			}
		}
		if (validStatus.isError) {
			//determine error message and return
			return;
		}
		const dupEmail = await userSchema.findOne({ email: email });
		if (dupEmail) {
			return { status: false, email: true, msg: "email exists" };
		}
		var passhash;
		await bcrypt.hash(password, saltRounds).then(function (hash) {
			passhash = hash;
		});
		const uid = crypto.randomBytes(16).toString("hex");
		const newUser = {
			uid: uid,
			name: this.schema.seperateNames ? firstName : fullName,
			email: email,
			password: passhash,
		};
		if (this.schema.seperateNames) newUser.surname = lastName;
		try {
			await new userSchema(newUser).save();
			return this.login({ password, email });
		} catch (err) {
			return { msg: "some error occoured", status: false };
		}
	}

	async forgotPassword({ email }) {
		const exists = await userSchema.findOne({ email });
		if (exists) {
			const randomString = crypto.randomBytes(128).toString("hex");
			const resetURL = this.ROOT + this.NEW_PASSWORD_ENDPOINT + "?prstr=" + randomString;
			await resetPasswordSchema({
				uid: exists.uid,
				resetString: randomString,
			}).save();
			if(this.sender){
				this.sendMail({
					email:exists.email, 
					html:`${resetPasswordMarkup(this.appName, exists.name, resetURL)}`,
					subject:"Password reset request",

				})
			}
			return { status: true, url: resetURL };
		}
		return { status: true };
	}
	async resetPassword({ token, newPassword }) {
		const valid = await resetPasswordSchema.findOne({ resetString: token });
		console.log(valid);
		if (valid) {
			const errors = this.validator.checkPass(newPassword);
			const obj = findErrorInObj(errors);
			if (obj.isError) {
				return { status: false, msg: "Invalid Password", errors };
			}

			const newHashedPassword = await bcrypt.hash(newPassword, saltRounds);
			await userSchema.updateOne(
				{ uid: valid.uid },
				{ $set: { password: newHashedPassword, modified: Date.now } },
				{ new: true }
			);
			if(this.sender){
				const user = await userSchema.findOne({uid: valid.uid });
				this.sendMail({
					email:valid.email, 
					subject:"Password Changed",
					html:passwordChanged(this.appName, user.email)
				})

			}
			valid.deleteOne();
			return { status: true };
		} else {
			return { status: false, msg: "link expired" };
		}
	}
}

module.exports = Auth;
