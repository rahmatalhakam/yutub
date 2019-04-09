const mongoose = require("mongoose");
const CommentSchema = new mongoose.Schema({
  id_video: {
    type: String,
    required: true
  },
  name: String,
  comment: String,
  created_at: { type: Date, default: Date.now }
});
mongoose.model("Comment", CommentSchema);

module.exports = mongoose.model("Comment");
