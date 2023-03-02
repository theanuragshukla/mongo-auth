# mongo-authify
mongo-authify is an npm package that provides a simple authentication system for your MongoDB database. It allows you to easily manage user signup, login, and password reset functionality with a customizable schema for user data validation.

## installation

You can install the package via npm:
```sh
npm install mongo-authify
```

## Usage

### initialisation

To use mongo-authify, you need to import it and create an instance of the Auth class. You need to provide your MongoDB URL as the first argument to the constructor:

```js
const Auth = require("mongo-authify");

const auth = new Auth("mongodb://localhost:27017/my-database");
```
The Auth class takes the `mongoURL` as its argument. You can also pass a `schema` object, a `ROOT` url, and a `NEW_PASSWORD_ENDPOINT` as optional arguments.

### Configuring Options

You can also configure various options when initializing Auth:

```js
const auth = new Auth(mongoURL, schema, ROOT, NEW_PASSWORD_ENDPOINT);

auth.config({
    appName: "My App",
    schema: myCustomSchema, // check the scheme section
    ROOT: "https://my-app.com",
    NEW_PASSWORD_ENDPOINT: "/new-password",
    mongoURL: "mongodb://localhost:27017/my-database",
    mailer: {
        service: "Gmail",
        email: "myapp@gmail.com",
        password: "mypassword"
    }
});
```

The available options are:
- mongoURL (required): the MongoDB URL to connect to
- schema: the schema for user data validation (default is a simple schema for email and password fields)
- ROOT: the root URL of your application (default is http://localhost:3000)
- NEW_PASSWORD_ENDPOINT: the endpoint for resetting passwords (default is /reset-password)
- appName: the name of your application (default is mongo-authify)
- mailer: an object containing your email service, email, and password for sending password reset emails. If this option is not provided, the package will not be able to send password reset emails.

### Signing Up
To create a new user, call the signup method and provide the required user data as an object:

```js
const user = await auth.signup({
    fullName: "John Doe", // not required if schema.seperateNames===true
    firstName: "John",
    lastName: "Doe",
    password: "password123",
    email: "john.doe@example.com"
});

```
The signup method signs up a user and returns a status and a message. 

### Logging in

To log in a user, call the login method and provide the user's email and password:
```js
const user = await auth.login({
    email: "john.doe@example.com",
    password: "password123"
});

```
The login method logs in a user and returns a user object if the login was successful, otherwise it returns a status and a message.

### Forgot Password
To reset a user's password, call the resetPassword method and provide the user's email address:
```js
await auth.resetPassword("john.doe@example.com");

```
The Password reset url will redirect user to `NEW_PASSWORD_ENDPOINT`. Make sure to provide input fields to enter new password.
The `newPasswowrd` can be managed by using any version of this code:
```js
app.post('/new-password',async (req, res)=>{
	const {newPassword} = req.body
	const {prstr} = req.query
	const response = await auth.resetPassword({token:prstr, newPassword}) // returns {status:true/false}
	
  // handle response
  
  res.json(response)
})
```

## Schema 
A JSON schema is used to validate the user infornation like name, enail, pass, etc. The default Schema is:
```js
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
```
This schema can be overrided by providing any modified key in schema argument of `config()` and/or `constructor` of the package. for example:

```js
const customSchema = {
// make sure to provide all sub-keys of any key in Schema
  password: {
		min: 10,
		max: 128,
		required: {
			lowercase: true,
			uppercase: true,
			number: true,
			symbol: true,
		},
	},
}
const auth = new Auth(mongoURL, customSchema);
// OR
auth.config({
  schema:customSchema,
})
```

# Provisioned Features
- Email verification
- Sending Mail on Signup 
- Managing Sessions

# Contributing

Anyone interested in improving this repo are welocomed. Make sure to raise issues regarding:
- Bugs
- New Features
- anything else


