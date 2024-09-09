const axios = require('axios');
const ProcessingRequest = require('../models/processingRequest.model');
const logger = require('../config/logger'); // Import the logger

// Trigger webhook after all images are processed
const triggerWebhook = async (requestId, callbackUrl, status, errorMessage = null) => {
  try {
    const request = await ProcessingRequest.findOne({ requestId });
    let webhookRequest;
    if(errorMessage == null){
      webhookRequest = {
        requestId,
        status,
        data: request.data,
      };
    }
    else{
      webhookRequest = {
        requestId,
        status,
        data: request.data,
        error: errorMessage,
      };
    };

    await axios.post(callbackUrl, webhookRequest);

    logger.info(`Webhook triggered for request ID ${requestId} with status: ${status}`);
  } catch (error) {
    logger.error(`Error triggering webhook for request ID ${requestId}: ${error.message}`);
  }
};

module.exports = triggerWebhook;
