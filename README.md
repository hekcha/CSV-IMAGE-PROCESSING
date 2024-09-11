# Technical Design Document: CSV Image Processing System


## 0. How to setup
- Setup the whole project in less than 2 minutes just like a maggie.
```
json
cd image-processing
docker compose up
```
- Import the test.postman_collection.json file to the Postman collection
- Ready to go!

- LLD DIAGRAM: https://drive.google.com/file/d/1OWEPv5IOqDOzh2MMPftBCymYH8tGm32n/view?usp=sharing

## 1. Objective
The objective of this system is to provide a scalable and efficient solution to process image URLs provided via a CSV file. The images are compressed and stored, and the user can retrieve the processing status or get notified through a webhook once the process completes.

## 2. System Overview
The system receives a CSV file containing image URLs and asynchronously compresses the images. It consists of two primary endpoints:

- **CSV Upload API**: Allows users to upload a CSV file and returns a unique request ID for tracking.
- **Status API**: Allows users to check the processing status using the request ID.

Additionally, a Webhook system is in place to notify users upon processing completion.

## 3. Components

### 3.1. CSV Upload API
- **Endpoint**: `/csvHandler/upload`
- **Description**: Accepts a CSV file and asynchronously begins the process of compressing images. Returns a unique request ID for tracking the job.
- **Input**:
  - CSV file (in `multipart/form-data`).
  - Callback URL (optional) for webhook notification.
- **Output**: A request ID, which the user can use to query the status.

### 3.2. Status API
- **Endpoint**: `/csvHandler/status`
- **Description**: Allows the user to check the status of image processing using the request ID.
- **Input**: Request ID (as a JSON body).
- **Output**: Processing status (`Processing`, `Completed`, or `Failed`), along with detailed information about the processed images.

### 3.3. Image Processing Service
- **Description**: This service takes the image URLs from the CSV, downloads them, and compresses the images to 50% of their original quality using an image processing library (Sharp).
- **Asynchronous Workers**: Multiple workers handle the compression tasks in parallel for better scalability.

### 3.4. Webhook System
- **Description**: A user-provided callback URL is triggered once the image processing task is complete. The webhook sends a status update along with the processed data.

### 3.5. Database Interaction
- **Database**: A NoSQL database (MongoDB) is used to store request information, including the request ID, processing status, input/output image URLs, and messages regarding errors or success.
- **Schema**: The database schema is designed to store product data and track the status of image processing jobs.

## 4. API Endpoints

### 4.1. Upload API
- **Method**: `POST`
- **Route**: `/csvHandler/upload`
- **Request Format**: `multipart/form-data`
  - `csv`: The CSV file containing image URLs.
  - `callbackUrl`: The URL to trigger a webhook when the process is complete.
- **Response**:
  - `202 Accepted`: Returns a `requestId` for tracking.
  - `400 Bad Request`: Invalid input or missing CSV file.
  - `500 Internal Server Error`: Error in processing the CSV.

### 4.2. Status API
- **Method**: `GET`
- **Route**: `/csvHandler/status`
- **Request Format**: `application/json`
  - `requestId`: The request ID returned during upload.
- **Response**:
  - `200 OK`: Returns processing status and data.
  - `404 Not Found`: Request ID not found.
  - `500 Internal Server Error`: Error in checking the status.

## 5. Database Design

### 5.1. ProcessingRequest Model
```json
{
  "requestId": "String",        // Unique request ID
  "status": "String",           // 'Processing', 'Completed', or 'Failed'
  "callbackUrl": "String",      // Webhook URL
  "data": "Array",              // Array of product image details (serialNumber, productName, inputImageUrls, outputImageUrls)
  "message": "String",          // Error or success message
  "createdAt": "Date",          // Timestamp of when the request was created
  "updatedAt": "Date"           // Timestamp of the last update
}
```

## 6. Image Processing Flow

### 6.1. CSV Parsing
The system parses the CSV file, extracting the following columns:

- **Serial Number**: Unique identifier for the product.
- **Product Name**: Name of the product.
- **Input Image URLs**: Comma-separated URLs of images.

### 6.2. Image Compression
For each product, the input image URLs are processed using an asynchronous image processing service (Sharp) to compress the images by 50%.

### 6.3. Saving Results
Once the images are processed, the compressed image URLs are saved in the database under the same request ID, and the status is updated to `Completed`.

### 6.4. Error Handling
If an error occurs during the CSV parsing or image compression process, the status is updated to `Failed`, and an error message is logged.

### 6.5. Webhook Trigger
After processing the images, the system sends a notification to the callback URL (if provided) with the request ID, status, and image data.

---

## 7. Validation

### 7.1. CSV Validation
The system ensures the CSV is correctly formatted, checking for valid columns (serial number, product name, image URLs).

### 7.2. Image URL Validation
The system validates that all URLs provided in the CSV are valid and reachable.

---

## 8. Asynchronous Workers
The system uses multiple asynchronous workers to handle image compression tasks, ensuring that large batches of images can be processed in parallel without blocking the main thread.

---

## 9. Logging and Monitoring
The system logs all activities, including:

- CSV uploads.
- Processing initiation.
- Validation failures.
- Image compression success or failure.

A monitoring service can be added in the future to keep track of processing times, errors, and overall system health.

---

## 10. Technical Stack

- **Backend Framework**: Node.js (Express)
- **Database**: MongoDB (NoSQL)
- **Image Processing**: Sharp library for compressing images.
- **API Documentation**: Swagger for documenting API endpoints.
- **Logging**: Integrated logger to track system operations.

---

## 11. Future Improvements

- **Batch Processing**: Improve scalability by adding batch processing for large CSV files.
- **Image Format Support**: Extend image processing to handle different image formats.
- **Enhanced Validation**: Add validation for non-reachable image URLs.
- **Cloud Integration**: Integrate with cloud storage services like AWS S3 for storing images.

---

## 12. Conclusion
This system efficiently processes image data from CSV files, providing users with real-time status tracking and webhook notifications. The scalable and modular architecture allows for easy future enhancements, such as handling larger datasets and integrating advanced image processing techniques.
