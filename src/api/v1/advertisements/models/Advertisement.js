const mongoose = require("mongoose");

const adSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    validate:
      /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["top-left", "bottom-right"],
    default: "top-left",
  },
});

module.exports = mongoose.model("advertisement", adSchema);
