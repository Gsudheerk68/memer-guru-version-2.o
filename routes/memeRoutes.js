import express from 'express'
import multer from 'multer'
import Meme from '../models/Meme.js'
import { storage, cloudinary } from '../config/cloudinary.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()
const upload = multer({ storage })
const TRANSFORM = { width: 1080, height: 1920, crop: 'fill', gravity: 'auto' }

router.get('/', async (req, res) => {
  try {
    const memes = await Meme.find().populate('uploadedBy', 'name avatar').sort({ createdAt: -1 })
    res.json(memes)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch memes.' })
  }
})

router.post('/upload', protect, upload.single('media'), async (req, res) => {
  try {
    const { caption, mediaLink } = req.body
    let mediaUrl = '', mediaType = 'image'

    if (req.file) {
      mediaUrl = req.file.path
      mediaType = req.file.mimetype.startsWith('video') ? 'video' : 'image'
    } else if (mediaLink) {
      const isYouTube = /youtube|youtu\.be|shorts/i.test(mediaLink)
      const isVideo = isYouTube || /\.(mp4|webm|ogg|mov)$/i.test(mediaLink)
      if (isYouTube) {
        mediaUrl = mediaLink
        mediaType = 'video'
      } else {
        const result = await cloudinary.uploader.upload(mediaLink, {
          folder: 'memers-guru',
          resource_type: isVideo ? 'video' : 'image',
          transformation: [TRANSFORM],
        })
        mediaUrl = result.secure_url
        mediaType = isVideo ? 'video' : 'image'
      }
    } else {
      return res.status(400).json({ message: 'Please upload a file or provide a link.' })
    }

    const meme = await Meme.create({ caption, mediaUrl, mediaType, uploadedBy: req.user._id })
    res.status(201).json(meme)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.post('/:id/like', async (req, res) => {
  try {
    const meme = await Meme.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } }, { new: true })
    res.json(meme)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.post('/:id/view', async (req, res) => {
  try {
    const meme = await Meme.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true })
    res.json(meme)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.delete('/:id', protect, async (req, res) => {
  try {
    const meme = await Meme.findById(req.params.id)
    if (!meme) return res.status(404).json({ message: 'Meme not found.' })
    if (meme.uploadedBy?.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized.' })
    const urlParts = meme.mediaUrl.split('/')
    const filename = urlParts[urlParts.length - 1].split('.')[0]
    const publicId = `memers-guru/${filename}`
    await cloudinary.uploader.destroy(publicId, { resource_type: meme.mediaType })
    await Meme.findByIdAndDelete(req.params.id)
    res.json({ message: 'Meme deleted.' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
