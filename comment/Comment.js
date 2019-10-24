const mongoose = require('mongoose')
const Schema = mongoose.Schema
const CommentSchema = Schema({
  comment: String,
  created_at: { type: Date, default: Date.now },
  id_video: { type: Schema.Types.ObjectId, ref: 'Video', required: true },
  id_user: { type: Schema.Types.ObjectId, ref: 'User', required: true }
})
mongoose.model('Comment', CommentSchema)

module.exports = mongoose.model('Comment')
