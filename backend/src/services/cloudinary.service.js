const cloudinary = require("../config/cloudinary");

// upload function
exports.uploadToCloudinary = async (fileBuffer) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {folder: "products"},
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    )
    .end(fileBuffer);
  });
}