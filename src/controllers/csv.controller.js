const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const csvParser = require('csv-parser');
const axios = require('axios');
const sharp = require('sharp');
const ProcessingRequest = require('../models/processingRequest.model');
const Joi = require('joi');
const logger = require('../config/logger'); // Import the logger
const compressImages = require('../utils/compressImage');
const triggerWebhook = require('../utils/triggerWebhook');
const {Parser} = require('json2csv'); 

// Validation function for JSON data
async function validateJSON(jsonData) {
  const schema = Joi.object({
    serialNumber: Joi.alternatives().try(
      Joi.string().pattern(/^\d+$/),  // Allows a string with only digits
      Joi.number().integer()  // Allows an integer number
    ).required(),
    
    productName: Joi.string().required(),  // Validate product name as a required string
    
    inputImageUrls: Joi.array().items(
      Joi.string().uri().required()  // Ensure each URL is a valid URI format
    ).required()  // inputImageUrls must be an array and is required
  });

  jsonData.forEach((item, index) => {
    const { error } = schema.validate(item);
    if (error) {
      logger.error(`Validation error in item at index ${index}: ${error.details}`);
      throw new Error(`Validation error in item at index ${index}: ${error.details}`);
    } else {
      logger.info(`Item at index ${index} is valid.`);
    }
  });
}

// Upload CSV and start processing images
// Upload CSV and start processing images
const uploadCSV = async (req, res) => {
  logger.error('Processing CSV file');
  let processingRequests = {};

  try {
    if (!req.files || !req.files.csv) {
      return res.status(400).send('No CSV file uploaded');
    }

    if (!req.body.callbackUrl) {
      return res.status(400).send('No callback URL provided');
    }

    const callbackUrl = req.body.callbackUrl;
    const file = req.files.csv;

    if (file.mimetype !== 'text/csv') {
      return res.status(400).send('Only CSV files are allowed');
    }

    const requestId = uuidv4();
    logger.info(`Processing request initiated. Request ID: ${requestId}`);

    // Insert request into DB
    await ProcessingRequest.create({ requestId, status: 'Processing', callbackUrl, message: 'Request in progress' });
    processingRequests[requestId] = { requestId, status: 'Processing', message: 'Request in progress', callbackUrl, data: [] };

    const results = [];

    // Parse CSV
    fs.createReadStream(file?.tempFilePath)
      .pipe(csvParser({ delimiter: ',' }))
      .on('data', (row) => {
        const images = row['Input Image Urls'].split(',');
        results.push({ serialNumber: row['Serial Number'], productName: row['Product Name'], inputImageUrls: images });
      })
      .on('end', async () => {
        try {
          logger.info('CSV parsing completed');
          await validateJSON(results);
          processingRequests[requestId].data = results;
          await ProcessingRequest.findOneAndUpdate({ requestId }, { data: results }, { new: true, upsert: true });

          res.status(202).send({ requestId });
          // Process images asynchronously
          await processImages(requestId, results, callbackUrl);
          res.end();

        } catch (error) {
          logger.error(`Validation or processing error: ${error.message}`);
          await ProcessingRequest.updateOne({ requestId }, { status: 'Failed', message: error.message });
          await triggerWebhook(requestId, callbackUrl, 'failed', error?.message);
          res.status(500).send('Error processing the CSV data.');
        }
      });
  } catch (error) {
    logger.error(`Error reading the CSV: ${error.message}`);
    res.status(500).send('Error reading the CSV file. Either the file is empty or it is not a valid CSV file.');
  }
};


// Check status of image processing using requestId
const checkStatus = async (req, res) => {
  try {
    const requestId = req.body.requestId;
    const request = await ProcessingRequest.findOne({ requestId });

    if (!request) {
      return res.status(404).send('Request ID not found');
    }

    if (request.status === 'Completed' && request.csvFile) {
      // Send the CSV file in the response
      res.setHeader('Content-Disposition', `attachment; filename="processed_images_${requestId}.csv"`);
      res.setHeader('Content-Type', 'text/csv');
      return res.status(200).end(request.csvFile); // Return the saved CSV from the database
    } else {
      return res.status(200).json({
        requestId: request.requestId,
        status: request.status,
        message: request.message,
        data: request.data
      });
    }

  } catch (error) {
    logger.error(`Error checking status for request ID ${req.params.requestId}: ${error.message}`);
    res.status(500).send('Error checking request status.');
  }
};


// Function to process images asynchronously

const processImages = async (requestId, results, callbackUrl, res) => {
  try {
    const processedData = [];

    for (const row of results) {
      const inputImageUrls = row.inputImageUrls;
      const outputImageUrls = await compressImages(inputImageUrls);

      if (outputImageUrls == null) {
        throw new Error('Image processing failed. Failed in compression of images');
      }

      // Format the data as per the required structure
      processedData.push({
        serialNumber: row.serialNumber,
        productName: row.productName,
        inputImageUrls: inputImageUrls.join(','), // Join array into CSV format
        outputImageUrls: outputImageUrls.join(','), // Join array into CSV format
      });
    }

    // Convert processedData to CSV format
    const csvFields = ['serialNumber', 'productName', 'inputImageUrls', 'outputImageUrls'];
    const json2csvParser = new Parser({ fields: csvFields });
    const csv = json2csvParser.parse(processedData);

    // Store the properly formatted data along with CSV into MongoDB
    await ProcessingRequest.updateOne(
      { requestId },
      { 
        data: processedData, 
        status: 'Completed', 
        message: 'Image processing completed',
        csvFile: csv  // Save CSV as string in the database
      }
    );

    // Trigger the webhook with the processed CSV if needed
    await triggerWebhook(requestId, callbackUrl, 'completed');

  } catch (error) {
    logger.error(`Error processing images for request ID ${requestId}: ${error.message}`);
    await ProcessingRequest.updateOne({ requestId }, { status: 'Failed', message: 'Image processing failed. Failed in compression of images' });
    await triggerWebhook(requestId, callbackUrl, 'failed', error.message);
  }
};





module.exports = {
  uploadCSV,
  checkStatus,
};
