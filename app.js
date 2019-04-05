var express = require("express");
var app = express();
var cors = require("cors");
var db = require("./db");
app.use(cors());
var UserController = require("./user/UserController");
app.use("/users", UserController);
var VideoController = require("./video/VideoController");
app.use("/videos", VideoController);
app.get("/", (req, res) => {
  res.render("index");
});
module.exports = app;
