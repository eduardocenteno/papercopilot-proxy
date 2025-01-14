const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();

// Configure CORS for Chrome Extension
app.use(cors({
    origin: function (origin, callback) {
        // Allow Chrome extension and local development
        if (!origin || origin.startsWith('chrome-extension://')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));

// Parse JSON bodies
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

// Main API endpoint
app.post('/api/analyze', async (req, res) => {
    // Validate proxy key
    if (req.headers['x-proxy-key'] !== process.env.PROXY_KEY) {
        console.error('Invalid proxy key');
        return res.status(403).json({ error: 'Invalid proxy key' });
    }

    try {
        console.log('Received analysis request');
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('OpenAI API error:', error);
            return res.status(response.status).json(error);
        }

        const data = await response.json();
        console.log('Successfully processed request');
        res.json(data);

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
            error: 'Internal server error', 
            message: error.message 
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
        error: 'Internal server error', 
        message: err.message 
    });
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Environment:', process.env.NODE_ENV || 'development');
});
