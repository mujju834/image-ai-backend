require('dotenv').config(); // Load environment variables
const express = require('express');
const axios = require('axios');
const cors = require('cors'); // Import CORS
const { GoogleAuth } = require('google-auth-library'); // Google Auth library

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to parse JSON
app.use(express.json());

// Enable CORS for all origins (explicitly setting *)
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Google API Configuration
const GOOGLE_ENDPOINT = process.env.GOOGLE_ENDPOINT;

// Function to fetch a dynamic access token using the service account key
const getAccessToken = async () => {
  try {
    const auth = new GoogleAuth({
      keyFilename: process.env.GOOGLE_SERVICE_ACCOUNT_KEY, // Provide the file path directly
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    return accessToken.token; // Fetch the token property
  } catch (error) {
    console.error('Error fetching access token:', error.message);
    throw new Error('Failed to fetch access token');
  }
};

// Test GET Endpoint
app.get('/', (req, res) => {
  res.send('AI for image generation is working properly on backend!');
});

// Generate Image from Prompt
app.post('/generate-image', async (req, res) => {
  const { prompt, sampleCount = 3 } = req.body;

  if (!prompt) {
    return res.status(400).send({ error: 'Prompt is required' });
  }

  try {
    // Fetch the dynamic access token
    const accessToken = await getAccessToken();

    // Send API request to Google Cloud
    const response = await axios.post(
      GOOGLE_ENDPOINT,
      {
        instances: [{ prompt }],
        parameters: { sampleCount }, // Request multiple images
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`, // Use dynamic access token
          'Content-Type': 'application/json',
        },
      }
    );

    // Extract images from the response
    const images = response.data.predictions.map((prediction) => {
      return `data:image/png;base64,${prediction.bytesBase64Encoded}`;
    });

    // Return all images as an array
    res.json({ images });
  } catch (error) {
    console.error('Error generating image:', error.message);
    res.status(500).send({
      error: 'Failed to generate image',
      details: error.message,
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
