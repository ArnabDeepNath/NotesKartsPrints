const { AppError } = require("../middleware/errorHandler");
const {
  getPublicSiteSettings,
  getSiteSettings,
  saveSiteSettings,
} = require("../utils/siteSettings");

const getPublicSettings = async (req, res, next) => {
  try {
    const settings = await getSiteSettings();
    res.json({ settings: getPublicSiteSettings(settings) });
  } catch (err) {
    next(err);
  }
};

const getAdminSettings = async (req, res, next) => {
  try {
    const settings = await getSiteSettings();
    res.json({ settings });
  } catch (err) {
    next(err);
  }
};

const updateAdminSettings = async (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== "object") {
      throw new AppError("Invalid settings payload", 400);
    }

    const current = await getSiteSettings();
    const settings = await saveSiteSettings({ ...current, ...req.body });
    res.json({ message: "Settings updated", settings });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAdminSettings,
  getPublicSettings,
  updateAdminSettings,
};
