var express = require("express");
var router = express.Router();
var bodyParser = require("body-parser");
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());
const Comment = require("./Comment");
var VerifyToken = require("../auth/VerifyToken");

//create new comment by user
router.post("/", VerifyToken, (req, res) => {
  const { comment, id_video } = req.body;
  const id_user = req.userId;
  if (!comment || !id_user || !id_video) return res.sendStatus(400);
  Comment.create({ id_video, comment, id_user }, (err, comment) => {
    if (err)
      return res
        .status(500)
        .send("There was a problem adding the information to the database.");
    res.status(200).send(comment);
  });
});

//get comment by video
router.get("/", (req, res) => {
  const { id_video } = req.query;
  if (id_video) {
    Comment.find({ id_video })
      .populate("id_user", "name photo_profile")
      .exec((err, result) => {
        if (err)
          return res
            .status(500)
            .send(
              "There was a problem getting the information from the database."
            );
        res.status(200).send(result);
      });
  } else {
    Comment.find({})
      .populate("id_user", "name photo_profile")
      .exec((err, result) => {
        if (err)
          return res
            .status(500)
            .send(
              "There was a problem getting the information from the database."
            );
        res.status(200).send(result);
      });
  }
});

module.exports = router;
