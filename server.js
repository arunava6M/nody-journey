const express = require('express')
const { connectDB } = require('./config/db')
const userRoutes = require('./routes/userRoutes')
const authRoutes = require('./routes/authRoutes')

const app = express()
const PORT = 3000

connectDB()

//default middleware to parse request
app.use(express.json())
app.use('/user', userRoutes)
app.use('/auth', authRoutes)

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT} !`)
})