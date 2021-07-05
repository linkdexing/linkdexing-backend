const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const { createAd } = require("./controller");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); //Appending extension
  },
});

const upload = multer({ storage });

router.post("/", upload.single("image"), createAd);

module.exports = router;
