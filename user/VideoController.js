var express = require("express");
var router = express.Router();
var bodyParser = require("body-parser");
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

var Video = require("./Video");
router.post("/", function(req, res) {
  const { id_user, video_url, title, description } = req.body;
  Video.create(
    {
      id_user,
      video_url,
      title,
      description,
      created_at,
      updated_at: Date.now()
    },
    function(err, user) {
      if (err)
        return res
          .status(500)
          .send("There was a problem adding the information to the database.");
      res.status(200).send(user);
    }
  );
});
module.exports = router;
