const express = require("express");
var router = express.Router();
const bodyParser = require("body-parser");
const multer = require("multer");
const fs = require("fs");
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

const cloudinary = require("cloudinary");
var Video = require("./Video");
var Comment = require("../comment/Comment");
var config = require("../config");
var VerifyToken = require("../auth/VerifyToken");
cloudinary.config({
  cloud_name: config.cloud_name,
  api_key: config.api_key,
  api_secret: config.api_secret
});

const parser = multer({ dest: "storage/" });

//create new video post by user
router.post("/", [VerifyToken, parser.single("video")], (req, res) => {
  const { title, description } = req.body;
  if (!title || !description) return res.sendStatus(400);
  cloudinary.v2.uploader.upload(
    req.file.path,
    { resource_type: "video" },
    (error, result) => {
      fs.unlink(req.file.path, err => {
        if (err) throw err;
      });
      if (error) return res.status(500).send(error);
      const id_user = req.userId;
      const video_url = result.secure_url;
      const id_cloudinary = result.public_id;
      // const html_resource = cloudinary.video(id_video, {
      //   controls: true,
      //   width: "100%",
      //   height: "100%",
      //   invalidate: false
      // });
      const thumbnail = video_url.replace(".mp4", ".jpg");
      Video.create(
        {
          id_cloudinary,
          id_user,
          video_url,
          title,
          description,
          // html_resource,
          thumbnail,
          updated_at: new Date().toISOString()
        },
        (err, user) => {
          if (err)
            return res
              .status(500)
              .send(
                "There was a problem adding the information to the database."
              );
          res.status(200).send(user);
        }
      );
    }
  );
});

//get all videos
router.get("/all", (req, res) => {
  const { id_cloudinary, title, description, id_user, _id } = req.query;
  if (_id)
    Video.findById(_id)
      .populate("id_user", "name photo_profile")
      .exec((err, videos) => {
        if (err)
          return res.status(500).send("There was a problem finding the video.");
        if (videos.length < 1) return res.status(404).send("No video found.");
        res.status(200).send(videos);
      });
  else if (id_user)
    Video.find({ id_user })
      .populate("id_user", "name photo_profile")
      .exec((err, videos) => {
        if (err)
          return res.status(500).send("There was a problem finding the video.");
        if (videos.length < 1) return res.sendStatus(204);
        res.status(200).send(videos);
      });
  else
    Video.find({
      title: new RegExp(title, "i"),
      description: new RegExp(description, "i"),
      id_cloudinary: new RegExp(id_cloudinary)
    })
      .populate("id_user", "name photo_profile")
      .exec((err, videos) => {
        if (err)
          return res.status(500).send("There was a problem finding the video.");
        if (videos.length < 1) return res.status(404).send("No video found.");
        res.status(200).send(videos);
      });
});

//get videos by user
router.get("/", VerifyToken, (req, res) => {
  const { id_cloudinary, title, description, _id } = req.query;
  Video.find({
    id_user: req.userId,
    id_cloudinary: new RegExp(id_cloudinary),
    title: new RegExp(title, "i"),
    description: new RegExp(description, "i")
  })
    .populate("id_user", "name photo_profile")
    .exec((err, docs) => {
      if (err) return res.status(500).send(err);
      if (videos.length < 1) return res.status(404).send("No video found.");
      res.status(200).send(docs);
    });
});

//update attribute video by _id by user
router.put("/", VerifyToken, (req, res) => {
  const { _id } = req.body;
  req.body.updated_at = new Date().toISOString();
  if (!_id) return res.sendStatus(400);
  Video.updateOne({ id_user: req.userId, _id }, req.body, (err, docs) => {
    if (err)
      return res
        .status(500)
        .send("There was a problem updating the video data");
    if (docs.nModified < 1) return res.status(404).send("No video found.");
    res.status(200).send("Updated");
  });
});
//delete video by id_cloudinary by user
router.delete("/", VerifyToken, (req, res) => {
  const { id_cloudinary, _id } = req.body;
  if (!id_cloudinary || !_id) return res.sendStatus(400);
  cloudinary.v2.uploader.destroy(
    id_cloudinary,
    { resource_type: "video" },
    (err, rst) => {
      if (err)
        return res.status(500).send("There was a problem deleting the video");
    }
  );

  Video.deleteOne({ _id, id_user: req.userId }, (err, docs) => {
    if (err)
      return res.status(500).send("There was a problem deleting the video");
    Comment.deleteMany({ id_video: _id }, (err, docs) => {
      if (err)
        return res
          .status(500)
          .send("There was a problem deleting the comment(s)");
      res.status(200).send("Deleted.");
    });
  });
});

module.exports = router;
