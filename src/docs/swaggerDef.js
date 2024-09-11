const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors'); // Import cors for API calls

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Image Processing API',
      version: '1.0.0',
      description: 'API to process images from a CSV file asynchronously and check the status of the process.',
      contact: {
        name: 'Abhishek Chaurasia',
        url: 'https://github.com/hekcha',
        email: 'your-email@domain.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000', // Your server URL
      },
    ],
  },
  apis: ['./src/routes/index.js'], // Path to your API routes with comments for Swagger
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
};
