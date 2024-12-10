const axios = require('axios');

class AIService {
    async analyzeCompetitor(instagramUsername) {
        try {
            // OpenAI API'yi kullanarak rakip analizi
            const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: "gpt-4",
                messages: [{
                    role: "system",
                    content: "Instagram profil analizi yapan bir uzmansın."
                }, {
                    role: "user",
                    content: `${instagramUsername} Instagram hesabını analiz et. Paylaşım sıklığı, içerik türleri, etkileşim oranları ve başarılı stratejileri hakkında detaylı bilgi ver.`
                }],
                temperature: 0.7
            }, {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data.choices[0].message.content;
        } catch (error) {
            throw new Error('Rakip analizi yapılamadı');
        }
    }

    async suggestHashtags(content) {
        try {
            const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: "gpt-4",
                messages: [{
                    role: "system",
                    content: "Instagram hashtag önerileri yapan bir uzmansın."
                }, {
                    role: "user",
                    content: `Bu içerik için en uygun Instagram hashtaglerini öner: ${content}`
                }],
                temperature: 0.7
            }, {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data.choices[0].message.content;
        } catch (error) {
            throw new Error('Hashtag önerileri alınamadı');
        }
    }
}

module.exports = new AIService(); 