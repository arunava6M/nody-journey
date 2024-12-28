/*
  Now we will start configuring mongoose into mongoDB
*/

// const { MongoClient, ObjectId } =require('mongodb')
const express= require('express');
const mongoose = require('mongoose');

const app = express()

//default middleware to parse request
app.use(express.json())


// mongoDB configuration to connect to db
// const client = new MongoClient('mongodb://localhost:27017')
// client.connect().then(()=>{
//   db=client.db('22_12_db')
//   console.log('DB connected')
// }).catch(err =>{
//   console.error(err)
// })

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
  name: {type: String, required: true}, // here required true will make sure all request to add a user has a name
  age: {type: Number, required: true},
  email: {type: String}
})

//Now mongoose uses the above schema to create a Model to interact with the User collection in the db
const User = mongoose.model('User', userSchema)

//Now this Model can be used for CRUD operation.
/* 
  So its like a role model you have defined, suppose sharukh khan as your role model, so you want to be like sharukh khan,
  Now you are tryin to talk like sharukh, so you started talking and the model in your mid is constantly telling you to talk like that ot not to talk like that.
  Beneath the Model has stored data how sharukh talks and is constantly matches with your try to talk. So the Model use the defined schema to check the data you provide while doing CRUD operations
*/

app.get('/users',async (req,res) => {
  try{
    // const collection = db.collection('users')
    // const users = await collection.find().toArray()
    const users = await User.find()
    res.status(200).json(users)  
  } catch (err) {
    res.status(400).json({error: err.message})
  }
})

app.post('/users',async (req,res) => {
  console.log(req.body)
  try {
    // the below is not required because schema will handle this
    // if(Object.keys(req.body)){
    //   res.status(200).json({message: 'User details not present'})
    // }
    const body = req.body
    // const collection = await db.collection('users')
    // collection.insertOne(body)
    await new User(body).save() // here .save is required to save the newly created instance from new User(body)
    res.status(200).json({message: 'Suucess'})
  } catch (err){
    res.status(400).json({error: err.message})
  }
})

app.put('/users/:id', async (req,res) => {
  try{
    
    // const result = await db.collection('users').updateOne(
    //   {_id: new ObjectId(req.params.id)},
    //   {$set: req.body}
    // )
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
    // const result = await db.collection('users').deleteOne({"_id": new ObjectId(req.params.id)})
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

app.listen(3000, () => {
  console.log('Server is running on 3000 !')
})


