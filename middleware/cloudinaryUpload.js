const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'campusconnect',
    resource_type: 'auto', // allows images + videos
  },
});

const upload = multer({ storage });

module.exports = upload;
