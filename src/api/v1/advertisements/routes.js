const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const { checkAuthStatus, isAdmin } = require("../admin/controller");
const { createAd, getTopLeftAdv, getBottomRightAdv } = require("./controller");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); //Appending extension
  },
});

const upload = multer({ storage });

router.post("/", checkAuthStatus, isAdmin, upload.single("image"), createAd);

router.get("/top-left", getTopLeftAdv);
router.get("/bottom-right", getBottomRightAdv);

module.exports = router;
