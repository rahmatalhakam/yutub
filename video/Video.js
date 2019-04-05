const mongoose = require("mongoose");
const VideoSchema = new mongoose.Schema({
  id_video: {
    type: String,
    required: true
  },
  id_user: {
    type: String,
    required: true
  },
  video_url: {
    type: String,
    required: true
  },
  title: String,
  description: String,
  created_at: { type: Date, default: Date.now },
  updated_at: Date
});
mongoose.model("Video", VideoSchema);
mongoose.set("useFindAndModify", false);

module.exports = mongoose.model("Video");
