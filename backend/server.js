const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// OpenAI API key (stored securely on server)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY_HERE';

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend API server is running' });
});

// OpenAI API proxy endpoint
app.post('/api/openai/chat', async (req, res) => {
  try {
    const { messages, model = 'gpt-4o', max_tokens = 4000, temperature = 0.7 } = req.body;

    console.log('🔑 Backend API - Using server-side API key');
    console.log('🔑 API Key starts with:', OPENAI_API_KEY.substring(0, 20));
    console.log('🔑 API Key ends with:', OPENAI_API_KEY.substring(OPENAI_API_KEY.length - 10));

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens,
        temperature,
      })
    });

    console.log('OpenAI API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error details:');
      console.error('Status:', response.status, response.statusText);
      console.error('Response body:', errorText);
      
      return res.status(response.status).json({
        error: 'OpenAI API error',
        status: response.status,
        details: errorText
      });
    }

    const data = await response.json();
    console.log('OpenAI response received successfully');
    
    res.json(data);
  } catch (error) {
    console.error('Backend API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Image analysis endpoint
app.post('/api/openai/analyze-image', async (req, res) => {
  try {
    const { prompt, base64Image, model = 'gpt-4o', max_tokens = 4000, temperature = 0.7 } = req.body;

    console.log('🔑 Backend API - Analyzing image with server-side API key');

    const messages = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`
            }
          }
        ]
      }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens,
        temperature,
      })
    });

    console.log('OpenAI API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error details:');
      console.error('Status:', response.status, response.statusText);
      console.error('Response body:', errorText);
      
      return res.status(response.status).json({
        error: 'OpenAI API error',
        status: response.status,
        details: errorText
      });
    }

    const data = await response.json();
    console.log('OpenAI image analysis completed successfully');
    
    res.json(data);
  } catch (error) {
    console.error('Backend API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend API server running on port ${PORT}`);
  console.log(`🔑 OpenAI API key configured: ${OPENAI_API_KEY ? 'YES' : 'NO'}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});
