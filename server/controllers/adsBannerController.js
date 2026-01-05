import path from "path";
import AdsBanner from "../models/adsBannerModel.js";

export const createAdsBanner = async (req, res) => {
  try {
    const { adBannerName, adBannerLink, adBannerPosition } = req.body;
    const adBannerImage = req.file;

    // Validation
    if (!adBannerName) {
      return res.status(400).send({ success: false, message: "adBannerName is required" });
    }
    if (!adBannerImage) {
      return res.status(400).send({ success: false, message: "Image is required" });
    }

    const adsBanner = new AdsBanner({
      name: adBannerName,
      link: adBannerLink,
      description: adBannerPosition, // Assuming adBannerPosition maps to description for now or just skip it
      photos: `uploads/banners/${path.basename(adBannerImage.path)}`
    });

    await adsBanner.save();

    res.status(201).send({
      success: true,
      message: "AdsBanner created successfully",
      adsBanner
    });
  } catch (error) {
    console.error("Error in creating adsBanner:", error);
    res.status(500).send({
      success: false,
      message: "Error in creating adsBanner",
      error: error.message
    });
  }
};

export const getAdsBanners = async (req, res) => {
  try {
    const adsbanners = await AdsBanner.find({ isActive: true }).select("-image");
    res.status(200).send({
      success: true,
      message: "All Banners",
      adsbanners,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in getting adsBanners",
      error: error.message,
    });
  }
};

export const getAdsBannerImage = async (req, res) => {
  try {
    const adsBanner = await AdsBanner.findById(req.params.bid).select("image");
    if (adsBanner.image.data) {
      res.set("Content-type", adsBanner.image.contentType);
      return res.status(200).send(adsBanner.image.data);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in getting adsBanner image",
      error,
    });
  }
};