const axios = require('axios');
const sharp = require('sharp');
const logger = require('../config/logger'); // Import the logger

const compressImages = async (imageUrls) => {
  logger.info(`Starting image compression for ${imageUrls.length} images`);
  const outputImageUrls = [];

  for (const [index, imageUrl] of imageUrls.entries()) {
    try {
      logger.info(`Fetching image ${index + 1}/${imageUrls.length}: ${imageUrl}`);
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });

      logger.debug(`Image ${index + 1} fetched successfully, starting compression`);
      const imageBuffer = Buffer.from(response.data, 'binary');
      const compressedImage = await compressImage(imageBuffer);

      // Normally you would replace this with your actual upload logic
      outputImageUrls.push(imageUrl); 
      logger.info(`Image ${index + 1} compressed successfully: ${imageUrl}`);
    } catch (error) {
      logger.error(`Error processing image: ${imageUrl} - ${error.message}`);
      logger.debug(`Full error stack for image ${imageUrl}: ${error.stack}`);
      outputImageUrls.push(null); // Handle image failures gracefully
    }
  }

  logger.info(`Completed image compression. ${outputImageUrls.length} images processed.`);
  return outputImageUrls;
};


async function compressImage(imageBuffer) {
  const metadata = await sharp(imageBuffer).metadata();
  logger.info(`Compressing image with format: ${metadata.format} and size: ${metadata.size} bytes`);
  
  let compressedImage;

  try {
    switch (metadata.format) {
      case 'jpeg':
      case 'jpg':
        logger.debug('Compressing JPEG image');
        compressedImage = await sharp(imageBuffer).jpeg({ quality: 50 }).toBuffer();
        break;
      case 'png':
        logger.debug('Compressing PNG image');
        compressedImage = await sharp(imageBuffer).png({ quality: 50 }).toBuffer();
        break;
      case 'webp':
        logger.debug('Compressing WebP image');
        compressedImage = await sharp(imageBuffer).webp({ quality: 50 }).toBuffer();
        break;
      case 'tiff':
        logger.debug('Compressing TIFF image');
        compressedImage = await sharp(imageBuffer).tiff({ quality: 50 }).toBuffer();
        break;
      default:
        logger.error(`Unsupported image format: ${metadata.format}`);
        throw new Error('Unsupported image format');
    }
  } catch (error) {
    logger.error(`Error compressing image: ${error.message}`);
    logger.debug(`Full error stack: ${error.stack}`);
    throw error;
  }

  logger.info('Image compression completed successfully');
  return compressedImage;
}

module.exports = compressImages;