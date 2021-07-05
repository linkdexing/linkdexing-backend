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
