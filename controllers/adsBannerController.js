import AdsBanner from "../models/adsBannerModel.js";
import fs from "fs";

export const createAdsBanner = async (req, res) => {
  try {
    const { adBannerName, adBannerLink, adBannerPosition } = req.body;
    const adBannerImage = req.file;
    
    console.log("Request body", req.body);
    console.log("Request file", req.file);

    // Validation
    if (!adBannerName) {
      return res.status(400).send({ success: false, message: "adBannerName is required" });
    }
    if (!adBannerImage) {
      return res.status(400).send({ success: false, message: "Image is required" });
    }
    if (adBannerImage.size > 1000000) {
      return res.status(400).send({ success: false, message: "Image should be less than 1mb" });
    }

    const adsBanner = new AdsBanner({
      adBannerName,
      adBannerLink,
      adBannerPosition,
      adBannerImage: {
        data: fs.readFileSync(adBannerImage.path),
        contentType: adBannerImage.mimetype
      }
    });

    await adsBanner.save();
    
    res.status(201).send({
      success: true,
      message: "AdsBanner created successfully",
      adsBanner: {
        id: adsBanner._id,
        adBannerName: adsBanner.adBannerName,
        adBannerLink: adsBanner.adBannerLink,
        position: adsBanner.adBannerPosition
      }
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