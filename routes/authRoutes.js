const express = require("express")
const {SECRET_KEY} = require('../config/constants')
const { body, validationResult } = require('express-validator');
const jwt = require("jsonwebtoken")

const router = express.Router()

router.post('/register',
  [ // this block is used by validationResult below to validate each of these fields
    body('firstName').notEmpty(),
    body('lastName').notEmpty(),
    body('email').isEmail(),
    body('password').isLength({min: 6})
  ],
  async (req, res) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
    return res.status(400).json({error: errors.array()})
  }
  try{
    const { firstName, lastName, email, password } = req.body
    const userExist = await User.findOne({email})
    if(userExist){
      return res.status(400).json({error: 'User already exist'})
    }
    const newUser = new User({firstName, lastName, email, password})
    await newUser.save()
    res.status(201).json({message: 'User registered successfully'})
  }catch(error){
    res.status(400).json({error: error.message})
  }
})


router.post('/login',
  [
    body('email').notEmpty(),
    body('password').notEmpty()
  ],
  async (req,res) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
    return res.status(400).json({error: errors.array()})
  }
  const {password, email} = req.body
  const user = await User.findOne({email})
  if(!user){
    return res.status(400).json({error: "User doesn't exist"})
  }
  const match = await bcrypt.compare(password, user.password)
  if(!match){
    return res.status(400).json({error: 'Credentials dont match'})
  }
  //if its a mtch create a jwt token
  const jwtToken = jwt.sign({id: user._id}, SECRET_KEY, {expiresIn: '1h'})
  res.status(200).json({jwtToken})
})

module.exports = router