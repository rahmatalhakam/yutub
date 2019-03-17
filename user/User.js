const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: Date
});
mongoose.model("User", UserSchema);
mongoose.set("useFindAndModify", false);
module.exports = mongoose.model("User");
