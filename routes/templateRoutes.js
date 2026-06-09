import express from 'express'
import multer from 'multer'
import Template from '../models/Template.js'
import { storage, cloudinary } from '../config/cloudinary.js'
import { protect, optionalAuth } from '../middleware/auth.js'

const router = express.Router()
const upload = multer({ storage })
const TRANSFORM = { width: 1080, height: 1920, crop: 'fill', gravity: 'auto' }

router.get('/', async (req, res) => {
  try {
    const templates = await Template.find().populate('uploadedBy', 'name avatar').sort({ createdAt: -1 })
    res.json(templates)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch templates.' })
  }
})

router.post('/upload', protect, upload.single('media'), async (req, res) => {
  try {
    const { movie, actor, dialogue, mediaLink } = req.body
    if (!movie || !actor || !dialogue)
      return res.status(400).json({ message: 'movie, actor, and dialogue are required.' })

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
      return res.status(400).json({ message: 'Please upload a file or provide a media link.' })
    }

    const template = await Template.create({
      movie, actor, dialogue, mediaUrl, mediaType,
      uploadedBy: req.user._id,
    })
    res.status(201).json(template)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.put('/:id', protect, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id)
    if (!template) return res.status(404).json({ message: 'Template not found.' })
    if (template.uploadedBy?.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized.' })
    const { movie, actor, dialogue } = req.body
    const updated = await Template.findByIdAndUpdate(req.params.id, { movie, actor, dialogue }, { new: true })
    res.json(updated)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.delete('/:id', protect, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id)
    if (!template) return res.status(404).json({ message: 'Template not found.' })
    if (template.uploadedBy?.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized.' })
    const urlParts = template.mediaUrl.split('/')
    const filename = urlParts[urlParts.length - 1].split('.')[0]
    const publicId = `memers-guru/${filename}`
    await cloudinary.uploader.destroy(publicId, { resource_type: template.mediaType })
    await Template.findByIdAndDelete(req.params.id)
    res.json({ message: 'Template deleted.' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.post('/:id/like', async (req, res) => {
  try {
    const template = await Template.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } }, { new: true })
    res.json(template)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.post('/:id/view', async (req, res) => {
  try {
    const template = await Template.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true })
    res.json(template)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
