const axios = require('axios');

// @desc    Generate content using AI
// @route   POST /api/ai/generate
// @access  Private
const generateContent = async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ message: 'Prompt is required' });
        }

        const apiKey = process.env.MISTRAL_API_KEY;

        if (!apiKey) {
            console.error('MISTRAL_API_KEY is missing in environment variables');
            return res.status(500).json({ message: 'AI service configuration error' });
        }

        // Call Mistral API
        const response = await axios.post(
            'https://api.mistral.ai/v1/chat/completions',
            {
                model: "mistral-tiny",
                messages: [
                    { role: "system", content: "You are a helpful educational assistant for teachers. Generate clear, age-appropriate content for school chapters. Use Markdown formatting." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 1000
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                timeout: 60000 // 60 seconds timeout
            }
        );

        if (response.data && response.data.choices && response.data.choices.length > 0) {
            const generatedText = response.data.choices[0].message.content;
            res.json({ text: generatedText });
        } else {
            throw new Error('Invalid response from AI provider');
        }

    } catch (error) {
        console.error('AI Generation Error:', error.response?.data || error.message);
        res.status(500).json({
            message: 'Failed to generate content',
            error: error.response?.data?.message || error.message
        });
    }
};

module.exports = {
    generateContent
};
