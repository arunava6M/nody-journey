const express = require("express")
const authMiddleware = require("../middleware/authMiddleware")
const User = require("../model/User")

const router = express.Router()


router.get('/aggregated',async (req,res) => {
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

router.get('/', authMiddleware, async (req,res) => {
  console.log('inside /')
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
    console.log(err.message)
    res.status(400).json({error: err.message})
  }
})

router.post('/',async (req,res) => {
  try {
    const body = req.body
    await new User(body).save() // here .save is required to save the newly created instance from new User(body)
    res.status(200).json({message: 'Suucess'})
  } catch (err){
    res.status(400).json({error: err.message})
  }
})

router.post('/instertMany', async (req,res) => {
  try {
    const result = await User.insertMany(req.body)
    res.status(200).json({message: 'Suucess', savedUsers: result})
  } catch (err){
    res.status(400).json({error: err.message})
  }
})

router.put('/:id', async (req,res) => {
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

router.delete('/:id',async (req,res)=>{
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

router.delete('/deleteAllUser', async (req,res) => {
  try{
    const result = await User.deleteMany({})
    if(result.deletedCount > 0){
      res.status(200).json({message: 'All user deleted !'})
    }
  }catch(error){res.status(400).json({error: error.message})}
})


module.exports = router