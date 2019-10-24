const mongoose = require('mongoose')
const Schema = mongoose.Schema
const UserSchema = Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true, unique: true },
  password: { type: String, required: true },
  photo_profile: { id_photo: String, photo_url: String },
  created_at: { type: Date, default: Date.now },
  updated_at: Date
})
mongoose.model('User', UserSchema)
mongoose.set('useFindAndModify', false)
mongoose.set('useCreateIndex', true)
module.exports = mongoose.model('User')
