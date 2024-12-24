const { MongoClient, ObjectId } =require('mongodb')
const express= require('express');

// pBl9doz23zUIMxn2
const mongoDBServer = 'mongodb+srv://aruneditnama:pBl9doz23zUIMxn2@nodebasicscluster.cmn0n.mongodb.net/?retryWrites=true&w=majority&appName=nodeBasicsCluster'
const app = express()
const DATABASE = 'NODY_DB'
const COLLECTION = 'users'

//default middleware to parse request
app.use(express.json())

let db;

const client = new MongoClient(mongoDBServer)
client.connect().then(()=>{
  db=client.db(DATABASE)
  console.log('DB connected')
}).catch(err =>{
  console.error(err)
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
    if(!Object.keys(req.body)){
      res.status(200).json({message: 'User details not present'})
    } else {
      const body = req.body
      const collection = await db.collection('users')
      collection.insertOne(body)
      res.status(200).json({message: 'Suucess'})
    }
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


// async function main(){
 
//   try {
//     await client.connect()
//     console.log('connected to MongoDB')
//     const db = client.db('22_12_db')
//     const collection = db.collection('users')
//     // const users = await collection.find().toArray()
//     console.log(users)
//   }catch (err){
//     console.error(err)
//   }
// }
// main();