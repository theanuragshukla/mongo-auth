const express = require('express')
require('dotenv').config()
const app = express()
const http = require('http').Server(app)

const MONGO_URL = process.env.MONGO_URL
const SERVICE = process.env.SERVICE
const EMAIL = process.env.EMAIL
const PASS = process.env.PASSWORD

const Auth = require('mongo-authify')

app.use(express.urlencoded({extended:true}))
app.use(express.json())

const auth = new Auth(MONGO_URL)

auth.config({appName:"test-app", mailer:{
	service:SERVICE, 
	email:EMAIL, 
	password:PASS
}})

app.post('/login', async(req , res)=>{
	const {email, password} = req.body
	const response = await auth.login({email, password})
	res.json(response)
})

app.post('/signup', async (req, res)=>{
	const {firstName,lastName,  email, password} = req.body
	const response = await auth.signup({email, password, firstName, lastName})
	res.json(response)

})

app.post('/reset-password',async (req, res)=>{
	const {email} = req.body
	const response = await auth.forgotPassword({email})
	res.json(response)
})

app.post('/new-password',async (req, res)=>{
	const {newPassword} = req.body
	const {prstr} = req.query
	console.log(prstr)
	const response = await auth.resetPassword({token:prstr, newPassword})
	res.json(response)
})

http.listen(3000, ()=>{
	console.log(`running on 3000`)
})
