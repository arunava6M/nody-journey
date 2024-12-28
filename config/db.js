exports.connectDB = () => {
  //mongoose configuration to connect to db
  mongoose.connect('mongodb://localhost:27017/22_12_db', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })

  const db = mongoose.connection
  db.on('error', () => console.log('Connection Error !'))
  db.once('open', () => console.log('Connected to MongoDB with Mongoose !'))
}