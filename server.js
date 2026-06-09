import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import passport from 'passport'
import templateRoutes from './routes/templateRoutes.js'
import memeRoutes from './routes/memeRoutes.js'
import authRoutes from './routes/authRoutes.js'

const app = express()
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }))
app.use(express.json())
app.use(passport.initialize())

app.use('/api/auth', authRoutes)
app.use('/api/templates', templateRoutes)
app.use('/api/memes', memeRoutes)

app.use((req, res) => res.status(404).json({ message: 'Route not found.' }))
app.use((err, req, res, next) => res.status(500).json({ message: 'Internal server error.' }))

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected')
    app.listen(process.env.PORT || 5000, () =>
      console.log(`Server running on http://localhost:${process.env.PORT || 5000}`)
    )
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message)
    process.exit(1)
  })
