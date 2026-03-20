const axios = require("axios");
const cloudinary = require("../config/cloudinary");

async function uploadImageFromUrl(imageUrl) {

  try {

    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer"
    });

    const result = await new Promise((resolve, reject) => {

      cloudinary.uploader.upload_stream(
        { folder: "avatars" },
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        }
      ).end(response.data);

    });

    return result.secure_url;

  } catch (err) {

    console.error("Avatar upload failed:", err.message);
    return null;

  }

}

module.exports = {
  uploadImageFromUrl
};