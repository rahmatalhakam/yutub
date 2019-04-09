var express = require("express");
var router = express.Router();
var bodyParser = require("body-parser");
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());
const Comment = require("./Comment");
var VerifyToken = require("../auth/VerifyToken");

//create new comment by user
router.post("/", VerifyToken, (req, res) => {
  const { id_video, comment, name } = req.body;
  if (!id_video || !comment || !name) return res.sendStatus(400);
  Comment.create({ id_video, name, comment }, (err, comment) => {
    if (err)
      return res
        .status(500)
        .send("There was a problem adding the information to the database.");
    res.status(200).send(comment);
  });
});

//get all comment
router.get("/all", (req, res) => {
  Comment.find({}, (err, result) => {
    if (err)
      return res
        .status(500)
        .send("There was a problem adding the information to the database.");
    res.status(200).send(result);
  });
});

//get comment by video
router.get("/", (req, res) => {
  const { id_video } = req.query;
  // if (!id_video) return res.sendStatus(400);
  if (id_video) {
    Comment.find(
      { id_video: new RegExp("^" + id_video + "$") },
      (err, result) => {
        if (err)
          return res
            .status(500)
            .send(
              "There was a problem adding the information to the database."
            );
        res.status(200).send(result);
      }
    );
  } else {
    Comment.find({}, (err, result) => {
      if (err)
        return res
          .status(500)
          .send("There was a problem adding the information to the database.");
      res.status(200).send(result);
    });
  }
});

module.exports = router;
