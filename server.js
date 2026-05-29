import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import templateRoutes from './routes/templateRoutes.js'
import memeRoutes from './routes/memeRoutes.js'

const app = express()  // ✅ create app first

// ✅ single cors setup, no trailing slash
app.use(cors({
  origin: "https://memersguruv2.netlify.app",
  credentials: true
}))

app.use(express.json())

app.use('/api/templates', templateRoutes)
app.use('/api/memes', memeRoutes)

app.use((req, res) => res.status(404).json({ message: 'Route not found.' }))
app.use((err, req, res, next) => res.status(500).json({ message: 'Internal server error.' }))

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected')
    app.listen(process.env.PORT || 5000, () =>
      console.log(`Server running on port ${process.env.PORT || 5000}`)
    )
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message)
    process.exit(1)
  })
