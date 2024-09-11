const mongoose = require('mongoose');

// Define the schema for processing requests
const processingRequestSchema = new mongoose.Schema({
  requestId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['Processing', 'Completed', 'Failed', 'Pending'],
    default: 'Processing'
  },
  message: { type: String },
  callbackUrl: { type: String },
  data: [
    {
      serialNumber: { type: String, required: true },
      productName: { type: String, required: true },
      inputImageUrls: [{ type: String, required: true }],
      outputImageUrls: [{ type: String }]
    }
  ],
  csvFile: { 
    type: String  // Field to store the CSV file content as a string
  }
}, {
  timestamps: true  // Automatically adds createdAt and updatedAt fields
});

// Create and export the model
const ProcessingRequest = mongoose.model('ProcessingRequest', processingRequestSchema);
module.exports = ProcessingRequest;
