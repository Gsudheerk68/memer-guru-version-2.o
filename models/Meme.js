import mongoose from 'mongoose'

const memeSchema = new mongoose.Schema({
  caption: String,
  mediaUrl: String,
  mediaType: String,
  likes: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.model('Meme', memeSchema)
