# Use the official Node.js image.
FROM node:18

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install the necessary dependencies
RUN npm install

# Copy the rest of the application code into the container
COPY . .

# Set environment variables
ENV PORT=3000
ENV MONGODB_URL=mongodb://127.0.0.1:27017/csvHandler

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]
