var express = require("express");
var router = express.Router();
var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");
var bodyParser = require("body-parser");
const multer = require("multer");
const fs = require("fs");
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

const cloudinary = require("cloudinary");
var User = require("./User");
var config = require("../config");
var VerifyToken = require("../auth/VerifyToken");

cloudinary.config({
  cloud_name: config.cloud_name,
  api_key: config.api_key,
  api_secret: config.api_secret
});

const parser = multer({ dest: "storage/" });

// create new user
router.post("/", function(req, res) {
  if (!req.body.name || !req.body.email || !req.body.password)
    return res.status(400).send("Bad Request");
  var hashedPassword = bcrypt.hashSync(req.body.password, 8);
  User.create(
    {
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
      updated_at: Date.now()
    },
    function(err, user) {
      if (err)
        return res
          .status(500)
          .send("There was a problem adding the information to the database.");
      var token = jwt.sign({ id: user._id }, config.secret, {
        expiresIn: 86400 // expires in 24 hours
      });
      res.status(200).send("success");
    }
  );
});

// login user
router.post("/login", function(req, res) {
  if (!req.body.email || !req.body.password)
    return res.status(400).send("Bad Request");
  User.findOne({ email: req.body.email }, function(err, user) {
    if (err) return res.status(500).send("Error on the server.");
    if (!user) return res.status(404).send("No user found.");

    var passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
    if (!passwordIsValid)
      return res.status(401).send({ auth: false, token: null });

    var token = jwt.sign({ id: user._id }, config.secret, {
      expiresIn: 86400 // expires in 24 hours
    });

    res.status(200).send({ auth: true, token: token });
  });
});

// RETURNS ALL THE USERS IN THE DATABASE
router.get("/all", function(req, res) {
  User.find(req.query, { password: 0 }, function(err, users) {
    if (err)
      return res.status(500).send("There was a problem finding the users.");
    res.status(200).send(users);
  });
});

//get user by token
router.get("/", VerifyToken, function(req, res, next) {
  const { name, email } = req.query;
  User.find(
    {
      _id: req.userId,
      name: new RegExp(name, "i"),
      email: new RegExp(email, "i")
    },
    { password: 0 },
    function(err, user) {
      if (err)
        return res.status(500).send("There was a problem finding the user.");
      if (!user) return res.status(404).send("No user found.");
      res.status(200).send(user);
    }
  );
});

// UPDATES A SINGLE USER IN THE DATABASE
router.put("/", VerifyToken, function(req, res) {
  req.body.updated_at = new Date().toISOString();
  User.findByIdAndUpdate(req.userId, req.body, { new: true }, function(
    err,
    user
  ) {
    if (err)
      return res.status(500).send("There was a problem updating the user.");
    res.status(200).send(user);
  });
});

//update photo profile
router.put("/attachment", [VerifyToken, parser.single("image")], (req, res) => {
  cloudinary.v2.uploader.upload(req.file.path, (err, result) => {
    fs.unlink(req.file.path, function(err) {
      if (err) throw err;
    });
    if (err) return result.status(500).send(error);
    const photo_url = result.secure_url;
    const id_photo = result.public_id;
    User.findByIdAndUpdate(
      req.userId,
      {
        $set: {
          "photo_profile.photo_url": photo_url,
          "photo_profile.id_photo": id_photo
        }
      },
      { new: true },
      (err, user) => {
        if (err)
          return res.status(500).send("There was a problem updating the user.");
        res.status(200).send(user);
      }
    );
  });
});

// DELETES A USER FROM THE DATABASE
router.delete("/", VerifyToken, function(req, res) {
  User.findByIdAndDelete(req.userId, function(err, user) {
    if (err)
      return res.status(500).send("There was a problem deleting the user.");
    res.status(200).send("User was deleted.");
  });
});

module.exports = router;
