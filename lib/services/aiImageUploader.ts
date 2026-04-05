import axios from "axios";
import cloudinary from "@lib/config/cloudinary";

export async function uploadImageFromUrl(imageUrl: string, folder = "posts", isBase64 = false): Promise<string | null> {
  try {
    let buffer: Buffer;
    let contentType = "image/png";

    if (isBase64) {
      const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
      buffer = Buffer.from(base64Data, "base64");
      const matches = imageUrl.match(/^data:image\/(\w+);base64,/);
      if (matches) contentType = `image/${matches[1]}`;
    } else {
      const response = await axios.get(imageUrl, {
        responseType: "arraybuffer",
        timeout: 15000
      });
      buffer = Buffer.from(response.data);
      const contentTypeHeader = response.headers["content-type"];
      if (contentTypeHeader) contentType = contentTypeHeader;
    }

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { 
          folder: folder,
          resource_type: "image",
          quality: "auto" 
        },
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        }
      ).end(buffer);
    }) as any;

    console.log("✅ Cloudinary upload successful:", result.secure_url);
    return result.secure_url;

  } catch (err: any) {
    console.error("❌ Cloudinary upload failed:", err.message);
    return null;
  }
}
