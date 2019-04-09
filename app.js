const express = require("express");
const app = express();
const cors = require("cors");
const db = require("./db");
app.use(cors());
const UserController = require("./user/UserController");
app.use("/users", UserController);
const VideoController = require("./video/VideoController");
app.use("/videos", VideoController);
const CommentController = require("./comment/CommentController");
app.use("/comments", CommentController);
app.get("/", (req, res) => {
  res.send("yutub-api");
});
module.exports = app;
