const mongoose = require('mongoose')
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
module.exports = mongoose.model('User', userSchema)

//Now this Model can be used for CRUD operation.