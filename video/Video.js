const mongoose = require('mongoose')
const Schema = mongoose.Schema
const VideoSchema = Schema({
  title: String,
  description: String,
  thumbnail: String,
  video_url: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: Date,
  id_user: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  id_cloudinary: { type: String, required: true }
})
mongoose.model('Video', VideoSchema)
mongoose.set('useFindAndModify', false)

module.exports = mongoose.model('Video')
