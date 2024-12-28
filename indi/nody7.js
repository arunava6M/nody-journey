/*
  Now comes the time for authentication. Specifically Token-Based Authentication (JWT - JSON Web Tokens)
*/

const express= require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken")

const app = express()
const userRouter = express.Router()

//default middleware to parse request
app.use(express.json())

//mongoose configuration to connect to db
mongoose.connect('mongodb://localhost:27017/22_12_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

const db = mongoose.connection
db.on('error', () => console.log('Connection Error !'))
db.once('open', () => console.log('Conected to MongoDB with Mongoose !'))

//Now in mongoose before defining any route , we need to configure the schema
const userSchema= new mongoose.Schema({
  firstName: {type: String, required: true}, // here required true will make sure all request to add a user has a name
  lastName: {type: String, required: true},
  age: {type: Number},
  email: {type: String, required: true},
  password: {type: String, required: true},
  city: {type: String}
})

/*
  Virtuals
  Suppose you need to have a field FullName in your user responses, but there is no point of storing thisd field because
  firtanme and lastname is already stored, so you just want add them and show full name

  Virtuals are fields in a Mongoose schema that are not stored in the database but are computed dynamically.

  a. Why Use Virtuals?
  Add derived properties (e.g., fullName from firstName and lastName).
  Useful for computed fields that don’t need to be saved.
  b. Add a Virtual
  Let’s add a fullName virtual to your User schema.
*/

userSchema.virtual('fullName').get(function () { //now you can access this separately like User.fullName
  return `${this.firstName} ${this.lastName}`;
})
/*
  By default virtuals are not included in the json response.
  so to include that we need to set virtuals as true by toJSON option
  
  The .set() method in Mongoose schemas allows you to configure specific behaviors or options for the schema. 
  Setting options like 'toJSON' or 'toObject' modifies how Mongoose documents behave when they are converted to JSON or plain JavaScript objects.
*/
userSchema.set('toJSON',{virtuals: true})

userSchema.pre('save',async function(next){ // Everytime a save is happening, just before saving in db, this pre middleware runs this function
  if(!this.isModified('password')) return next() //if the password is not modified, then no need to re-hash it, simply go to the next middleware
  /* 
    else use the hash function of bcrypt to hash the password to 
    10 salt rounds(higher the number more the encryption but slower too) and save it to the password
    and proceed to next middleware
  */
    this.password = await bcrypt.hash(this.password, 10) 
  next()
})

//Now mongoose uses the above schema to create a Model to interact with the User collection in the db
const User = mongoose.model('User', userSchema)

//Now this Model can be used for CRUD operation.
/* 
  So its like a role model you have defined, suppose sharukh khan as your role model, so you want to be like sharukh khan,
  Now you are tryin to talk like sharukh, so you started talking and the model in your mid is constantly telling you to talk like that ot not to talk like that.
  Beneath the Model has stored data how sharukh talks and is constantly matches with your try to talk. So the Model use the defined schema to check the data you provide while doing CRUD operations
*/

userRouter.post('/register',
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

const SECRET_KEY = 'e60e8e3ba3388bcc07e5f879498e833c782b224204b1d73f96d96e368c789f8b5f12e722dd27bd25b526a6e8b8d614b6d5aa9e6749565ac0eb8f448311ff925e93b6f5e6ba4f580832cc937e5ff080b3246ef9a70766d2da4f6d573319169f9f6fe61726c9dc6563bf7a19bdfb5f8d7c15b1330c20c8d1f0d27eccf549c93b86ba36d813e30284df7ff40887a2de9bb5a5fa6acbb91112f9375ed746d0785fbf573bded2aa870b183403ad6ab90b31383193de4d1f67d282b6d0539d53de33df2dcb70028ade49990eb456bf64047c8d834ada8a2b9c539e78d98dd7a681900b9450ff1e2f12b06c163f0ed516cb326e74d6d93959208ca48fdf94cdcecbaa2d'

userRouter.post('/login',
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

//create a autherisation middleware to check the token if valid, sent in req header
function authMiddleware(req,res,next){
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

app.use('/user', userRouter)

app.get('/users/aggregated',async (req,res) => {
  try{
    const {way} = req.query
    const pipeline = []
    if(way=='age'){
      pipeline.push(
        {$group: {_id: '$city', avgAge: {$avg: '$age'}}},
        // this go over each document and groups the data in a new response where id will be city and avgAge will have the average of all ages in that city
        {$project: {
          _id: 0, // dont show the field _id
          city: '$_id', // replace the _id with city as key
          avgAge: 1 // also we need to show the count, so basically show or not show depends on 1 or 0 value
        }}
      )
    }
    if(way=='count'){
      pipeline.push(
        {$group: {_id: '$city', count: {$sum: 1}}},
        // this go over each document and groups the data in a new response where id will be city and avgAge will have the average of all ages in that city
        {$project: {
          _id: 0, // dont show the field _id
          city: '$_id', // replace the _id with city as key
          count: 1 // also we need to show the count, so basically show or not show depends on 1 or 0 value
        }}
      )
    }
    /*
    What does $project do ?

    If we dont add $project, we will get response like this {_id: <city name>, avgAge/count: <number>}
    but if you want to show _id as "city" the response becomes more meaningful
    so that is done by $project, another stage in pipeline where you can shape the output

    Similarly there are many other stages in the aggregation pipeline
    */
    const result = await User.aggregate(pipeline)
    res.status(200).json({message: 'success', result})
  }catch (error){res.status(400).json({message: error.message})}
})

app.get('/users', authMiddleware, async (req,res) => {
  try{
    // filter
    const { age, name} = req.query // suppose we want to filter by age &/or name like /users?age=39 /users?name=John
    const query = {}
    if(age) query.age=Number(age)
    if(name) query.name=new RegExp(name, 'i')
    /*
    Why Use RegExp in MongoDB Queries?
      Partial Matching:
      If the user searches for ali, the regex new RegExp('ali', 'i') matches:
      "Alice"
      "Alina"
      "Malik"
      Without a regex, you would need an exact match (name: 'ali'), which is restrictive.

      Case-Insensitive Matching ('i' flag):
      Matches the string regardless of case.
      For example:
      name: 'ALI' matches Ali, aLi, or ali.

      Dynamic Search Criteria:
      If the search term is passed dynamically (e.g., via req.query.name), regex can adapt to varying input patterns without hardcoding the search logic.

      How It Works in MongoDB ?
      MongoDB supports regex in queries. For example:
      db.collection('users').find({ name: /ali/i });
      This matches all documents where the name field contains the substring ali (case-insensitively).
    */
    
    // sort
    const {sortBy='name', order='asc'} = req.query
    const sortOrder = order === 'asc' ? 1 : -1

    //pagination
    /*
      for pagination we need 2 functions .skip & .limit 
      .skip: this can skip mentioned number of documents from first
      here if we do User.find().skip(20) -> this will skip the first 20 documents and will show the rest

      .limit: this can show limited number of documents
      so if just called User.find().limit(20) -> this means it will show the first 20 documents

      Hence in pagination we will use power of these two functions,
      suppose you want to show per page 10 users only ,
      in 1st page, we will skip 0 documents and will show 10 documents only -> skip(0*10).limit(10) -> skip((Page - 1)*10).limit(10)
      next you went on 2nd page and want to show next 10 users, then we will skip then first 10 users and will show the next 10 users -> skip(10).limit(10) -> skip((Page-1)*10).limit(10)
      next you went on 3rd page and want to show next 10 users, then we will skip then first 20 users and will show the next 10 users -> skip(20).limit(10) -> skip((Page-1)*10).limit(10)
      
      Hence, we can create a formula, skip((page-1)*limit).limit(limit)
    */
    const { page=1, limit=10 } = req.query;
    const users = await User
      .find(query)
      .skip((page-1)* Number(limit))
      .limit(Number(limit))
      .sort({[sortBy]: sortOrder})
      
    res.status(200).json(users)  
  } catch (err) {
    res.status(400).json({error: err.message})
  }
})

app.post('/users',async (req,res) => {
  try {
    const body = req.body
    await new User(body).save() // here .save is required to save the newly created instance from new User(body)
    res.status(200).json({message: 'Suucess'})
  } catch (err){
    res.status(400).json({error: err.message})
  }
})

app.post('/users/instertMany', async (req,res) => {
  try {
    const result = await User.insertMany(req.body)
    res.status(200).json({message: 'Suucess', savedUsers: result})
  } catch (err){
    res.status(400).json({error: err.message})
  }
})

app.put('/users/:id', async (req,res) => {
  try{
    const user = await User.findByIdAndUpdate(req.params.id,req.body,{
      new: true, // without this mongoose returns the original document before update, so this makes sure updated one is returned
      runValidators: true // without this invalid data can be updated, so this ensures that on every update, the schema validations are run
    })
    if(user){
      res.status(200).json(user)
    } else {
      res.status(404).json({message: "User not found"})
    }

  }catch (error){
    res.status(400).json({error: error.message})
  }
})

app.delete('/users/:id',async (req,res)=>{
  try{
    const user = await User.findByIdAndDelete(req.params.id)
    if(user){
      res.status(200).json({message: 'User deleted'})
    } else {
      res.status(404).json({message: 'User not found'})
    }
  }catch(error){
    res.status(400).json({error: error.message})
  }
})

app.delete('/deleteAllUser', async (req,res) => {
  try{
    const result = await User.deleteMany({})
    if(result.deletedCount > 0){
      res.status(200).json({message: 'All user deleted !'})
    }
  }catch(error){res.status(400).json({error: error.message})}
})

app.listen(3000, () => {
  console.log('Server is running on 3000 !')
})


