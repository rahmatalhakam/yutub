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
var Comment = require("../comment/Comment");
var Video = require("../video/Video");
var config = require("../config");
var VerifyToken = require("../auth/VerifyToken");
// var VarifyImage = require("./VerifyImage");
cloudinary.config({
  cloud_name: config.cloud_name,
  api_key: config.api_key,
  api_secret: config.api_secret
});

const parser = multer({
  dest: "storage/"
});

// fileFilter: function(req, file, cb) {
//   let ext = path.extname(file.originalname);
//   if (ext !== ".jpeg" && ext !== ".png" && ext !== ".jpg") {
//     req.fileValidationError = "Forbidden extension";
//     return cb(null, false, req.fileValidationError);
//   }
//   cb(null, true);
// }

// create new user
router.post("/", function(req, res) {
  if (!req.body.name || !req.body.email || !req.body.password)
    return res.status(400).send("Bad Request");
  if (req.body.password.length < 6)
    return res.status(422).send("Password must be at least 6 characters");

  req.body.email = req.body.email.replace(/\s/g, "");
  var hashedPassword = bcrypt.hashSync(req.body.password, 8);
  User.create(
    {
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
      updated_at: Date.now()
    },
    (err, user) => {
      if (err) return res.sendStatus(409);
      var token = jwt.sign({ id: user._id }, config.secret, {
        expiresIn: 86400 // expires in 24 hours
      });
      res.sendStatus(201);
    }
  );
});

// login user
router.post("/login", function(req, res) {
  if (!req.body.email || !req.body.password)
    return res.status(400).send("Bad Request");
  User.findOne({ email: req.body.email }, (err, user) => {
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
    if (users.length < 1) return res.sendStatus(204);
    res.status(200).send(users);
  });
});

//get user by token
router.get("/", VerifyToken, function(req, res) {
  User.find(
    {
      _id: req.userId
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
  if (!req.body.password && !req.body.name) return res.sendStatus(400);
  if (req.body.email || req.body.created_at || req.body.updated_at)
    return res.sendStatus(422);
  if (req.body.password) {
    if (req.body.password.length < 6)
      return res.status(422).send("Password must be at least 6 characters");
    req.body.password = bcrypt.hashSync(req.body.password, 8);
  }
  req.body.updated_at = new Date().toISOString();
  User.findByIdAndUpdate(req.userId, req.body, { new: true }, (err, user) => {
    if (err) return res.status(500).send(err);
    res.status(200).send(user);
  });
});

//update photo profile
router.put("/attachment", [VerifyToken, parser.single("image")], (req, res) => {
  // console.log(req.fileValidationError, req.file.path);
  // if (req.fileValidationError)
  //   return res.status(403).send(req.fileValidationError);
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
    Video.deleteMany({ id_user: req.userId }, (err, docs) => {
      if (err)
        return res.status(500).send("There was a problem deleting the video");
      Comment.deleteMany({ id_user: req.userId }, (err, docs) => {
        if (err)
          return res
            .status(500)
            .send("There was a problem deleting the comment(s)");
        res.sendStatus(200);
      });
    });
  });
});

module.exports = router;
