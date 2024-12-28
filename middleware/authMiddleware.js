const jwt = require('jwt')
const {SECRET_KEY} = require('../config/constants')

exports.authMiddleware = (req,res,next) => {
  const token = req.headers['authorization']
  if(!token){
    return res.status(400).json({error: 'Token not provided'})
  }
  try{
    const decoded = jwt.verify(token.split(' ')[1], SECRET_KEY)
    req.user = decoded
    next()
  } catch(error){
    res.status(400).json({error: 'Invalid or expired token', details: error.message})
  }
}