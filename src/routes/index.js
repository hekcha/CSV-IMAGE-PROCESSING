const express = require('express');
const { uploadCSV, checkStatus } = require('../controllers/csv.controller');

const router = express.Router();

// Route to upload the CSV file and start image processing

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Upload CSV for image processing
 *     description: Upload a CSV file containing image URLs, which will be asynchronously processed (compressed). A request ID is returned to check the status later.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               csv:
 *                 type: string
 *                 format: binary
 *                 description: The CSV file to upload.
 *               callbackUrl:
 *                 type: string
 *                 description: The URL to which the webhook will send the status update once processing is complete.
 *     responses:
 *       202:
 *         description: CSV accepted for processing. Returns a request ID.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 requestId:
 *                   type: string
 *                   example: 78046803-9d8c-435d-9226-11c0262899dd
 *       400:
 *         description: Invalid input or no CSV file provided.
 *       500:
 *         description: Error in processing CSV.
 */

router.post('/upload', uploadCSV);

// Route to check the processing status

/**
 * @swagger
 * /status:
 *   get:
 *     summary: Check the status of the image processing
 *     description: Retrieve the current status of image processing using the request ID provided during CSV upload.
 *     parameters:
 *       - in: query
 *         name: requestId
 *         schema:
 *           type: string
 *         required: true
 *         description: The unique ID of the processing request.
 *     responses:
 *       200:
 *         description: Status of the image processing.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 requestId:
 *                   type: string
 *                 status:
 *                   type: string
 *                   example: Completed
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       serialNumber:
 *                         type: string
 *                       productName:
 *                         type: string
 *                       inputImageUrls:
 *                         type: array
 *                         items:
 *                           type: string
 *                       outputImageUrls:
 *                         type: array
 *                         items:
 *                           type: string
 *       404:
 *         description: Request ID not found.
 *       500:
 *         description: Error in checking status.
 */

router.get('/status', checkStatus);

module.exports = router;
