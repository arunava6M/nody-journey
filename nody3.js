const { MongoClient, ObjectId } =require('mongodb')
const express= require('express');
const mongoose = require('mongoose');

const app = express()

//default middleware to parse request
app.use(express.json())

let db;

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

app.get('/users',async (req,res) => {
  try{
    const collection = db.collection('users')
    const users = await collection.find().toArray()
    res.status(200).json(users)  
  } catch (err) {
    res.status(400).json({error: err.message})
  }
})

app.post('/users',async (req,res) => {
  console.log(req.body)
  try {
    if(Object.keys(req.body)){
      res.status(200).json({message: 'User details not present'})
    }
    const body = req.body
    const collection = await db.collection('users')
    collection.insertOne(body)
    res.status(200).json({message: 'Suucess'})
  } catch (err){
    res.status(400).json({error: err})
  }
})

app.put('/users/:id', async (req,res) => {
  try{
    
    const result = await db.collection('users').updateOne(
      {_id: new ObjectId(req.params.id)},
      {$set: req.body}
    )
    if(result.matchedCount > 0){
      res.status(200).json({message: "User updated"})
    } else {
      res.status(404).json({message: "User not found"})
    }

  }catch (error){
    res.status(400).json({error: error.message})
  }
})

app.delete('/users/:id',async (req,res)=>{
  try{
    const result = await db.collection('users').deleteOne({"_id": new ObjectId(req.params.id)})
    if(result.deletedCount >0){
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


