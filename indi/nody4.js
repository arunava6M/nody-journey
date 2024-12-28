/*
  Now we will start with filter, sorting & Pagination
*/

const express= require('express');
const mongoose = require('mongoose');

const app = express()

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
  console.log(req.body)
  try {
    const body = req.body
    await new User(body).save() // here .save is required to save the newly created instance from new User(body)
    res.status(200).json({message: 'Suucess'})
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

app.listen(3000, () => {
  console.log('Server is running on 3000 !')
})


