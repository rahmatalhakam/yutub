const express = require("express");
var router = express.Router();
const bodyParser = require("body-parser");
const multer = require("multer");
const fs = require("fs");
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

const cloudinary = require("cloudinary");
var Video = require("./Video");
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
  if (!req.body.title || !req.body.description)
    return res.status(400).send("Bad Request");
  const { title, description } = req.body;

  cloudinary.v2.uploader.upload(
    req.file.path,
    { resource_type: "video" },
    (error, result) => {
      fs.unlink(req.file.path, function(err) {
        if (err) throw err;
      });
      if (error) return res.status(500).send(error);
      const id_user = req.userId;
      const video_url = result.secure_url;
      const id_video = result.public_id;
      // const html_resource = cloudinary.video(id_video, {
      //   controls: true,
      //   width: "100%",
      //   height: "100%",
      //   invalidate: false
      // });
      const thumbnail = video_url.replace(".mp4", ".jpg");
      Video.create(
        {
          id_video,
          id_user,
          video_url,
          title,
          description,
          // html_resource,
          thumbnail,
          updated_at: new Date().toISOString()
        },
        function(err, user) {
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
  const { id_video, title, description } = req.query;
  Video.find(
    {
      title: new RegExp(title, "i"),
      description: new RegExp(description, "i"),
      id_video: new RegExp(id_video)
    },
    (err, videos) => {
      if (err)
        return res.status(500).send("There was a problem finding the videos.");
      res.status(200).send(videos);
    }
  );
});

//get videos by user
router.get("/", VerifyToken, (req, res) => {
  const { id_video, title, description } = req.query;
  Video.find(
    {
      id_user: req.userId,
      id_video: new RegExp(id_video),
      title: new RegExp(title, "i"),
      description: new RegExp(description, "i")
    },
    (err, docs) => {
      if (err)
        return res.status(500).send("There was a problem finding the video.");
      res.status(200).send(docs);
    }
  );
});

//update attribute video by id_video by user
router.put("/", VerifyToken, (req, res) => {
  req.body.updated_at = new Date().toISOString();
  const { id_video } = req.body;
  if (!id_video) return res.sendStatus(400);
  Video.updateOne(
    { id_user: req.userId, id_video },
    req.body,
    { new: true },
    (err, docs) => {
      if (err)
        return res
          .status(500)
          .send("There was a problem updating the video data");
      res.status(200).send(docs);
    }
  );
});
//delete video by id_video by user
router.delete("/", VerifyToken, (req, res) => {
  const { id_video } = req.body;
  if (!id_video) return res.sendStatus(400);
  cloudinary.v2.uploader.destroy(
    id_video,
    { resource_type: "video" },
    (err, rst) => {
      if (err)
        return res.status(500).send("There was a problem deleting the video");
    }
  );
  Video.deleteOne({ id_user: req.userId, id_video }, (err, docs) => {
    if (err)
      return res.status(500).send("There was a problem deleting the video");
    res.status(200).send(docs);
  });
});

module.exports = router;
