const Advertisement = require("./models/Advertisement");

exports.createAd = async (req, res, next) => {
  try {
    const { url, type } = req.body;
    const { filename } = req.file;

    const existingAd = await Advertisement.findOne({ url, type });

    if (existingAd) {
      await Advertisement.findByIdAndDelete(existingAd._id);
    }

    const ad = new Advertisement({
      url,
      type,
      imageUrl: `/uploads/${filename}`,
    });

    await ad.save();

    return res.status(201).json({
      ok: true,
      ad,
    });
  } catch (err) {
    return next(err);
  }
};

exports.getTopLeftAdv = async (req, res, next) => {
  try {
    const topLeftAdv = await Advertisement.find({ type: "top-left" });
    return res.status(200).json({
      ok: true,
      topLeftAdv,
    });
  } catch (err) {
    return next(err);
  }
};

exports.getBottomRightAdv = async (req, res, next) => {
  try {
    const bottomRightAdv = await Advertisement.find({ type: "bottom-right" });
    return res.status(200).json({
      ok: true,
      bottomRightAdv,
    });
  } catch (err) {
    return next(err);
  }
};
