const express = require('express')
const router = express.Router()
const Event = require('../models/Event')
const auth = require('../middleware/auth')

// Create Event — only for staff, clubhead, admin
router.post('/', auth, async (req, res) => {
  try {
    if (!['faculty', 'clubhead', 'admin'].includes(req.user.role))
      return res.status(403).json({ message: 'Not allowed' })

    const event = new Event({
      ...req.body,
      createdBy: req.user._id
    })
    await event.save()
    res.json(event)
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Get all events (populate participants)
router.get('/', async (req, res) => {
  const events = await Event.find()
    .populate('participants', 'name email')
    .sort({ createdAt: -1 })
  res.json(events)
})

// Register student
router.post('/:id/register', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) return res.status(404).json({ message: 'Event not found' })

    if (['faculty', 'clubhead', 'admin'].includes(req.user.role))
      return res.status(403).json({ message: 'Only students can register' })

    if (event.participants.includes(req.user._id))
      return res.status(400).json({ message: 'Already registered' })

    if (event.maxParticipants > 0 && event.participants.length >= event.maxParticipants)
      return res.status(400).json({ message: 'Event is full' })

    event.participants.push(req.user._id)
    await event.save()
    await event.populate('participants', 'name email')

    res.json({ message: 'Registered successfully', event })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
