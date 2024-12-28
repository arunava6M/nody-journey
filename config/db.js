const mongoose =  require("mongoose")

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://<username>:<password>@cluster0.mongodb.net/<database>?retryWrites=true&w=majority'
exports.connectDB = () => {
  //mongoose configuration to connect to db
  mongoose.connect(
    // 'mongodb://localhost:27017/22_12_db', 
    MONGO_URI,
    {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })

  const db = mongoose.connection
  db.on('error', () => console.log('Connection Error !'))
  db.once('open', () => console.log('Connected to MongoDB with Mongoose !'))
}