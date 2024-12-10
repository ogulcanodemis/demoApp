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

    async generateContentSuggestions(competitorData) {
        try {
            const prompt = this.createContentSuggestionPrompt(competitorData);
            const response = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: "Instagram içerik stratejisti olarak görev yapıyorsun."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7
            });

            return this.parseContentSuggestions(response.choices[0].message.content);
        } catch (error) {
            console.error('İçerik önerisi oluşturma hatası:', error);
            throw error;
        }
    }

    createContentSuggestionPrompt(data) {
        const { post_analysis, hashtag_analysis, timing_analysis } = data;
        
        return `
        Aşağıdaki verilere dayanarak Instagram içerik önerileri oluştur:
        
        En başarılı içerik türleri: ${Object.entries(post_analysis.content_type_distribution)
            .map(([type, count]) => `${type} (${count} post)`).join(', ')}
        
        En etkili hashtagler: ${hashtag_analysis.slice(0, 5)
            .map(tag => `#${tag.tag}`).join(', ')}
        
        En iyi paylaşım zamanları: ${timing_analysis
            .sort((a, b) => b.avg_engagement - a.avg_engagement)
            .slice(0, 3)
            .map(time => `${time.hour}:00`).join(', ')}
        
        Lütfen şunları içeren 5 içerik önerisi oluştur:
        1. İçerik türü
        2. Başlık önerisi
        3. Hashtag önerileri
        4. En iyi paylaşım zamanı
        5. Hedef etkileşim stratejisi
        `;
    }

    parseContentSuggestions(aiResponse) {
        // AI yanıtını yapılandırılmış formata dönüştür
        const suggestions = aiResponse.split('\n\n')
            .filter(suggestion => suggestion.trim())
            .map(suggestion => {
                const lines = suggestion.split('\n');
                return {
                    content_type: lines[0].replace(/^\d+\.\s*/, ''),
                    caption: lines[1]?.replace(/Başlık:\s*/, ''),
                    hashtags: lines[2]?.replace(/Hashtagler:\s*/, '').split(' '),
                    best_time: lines[3]?.replace(/Paylaşım zamanı:\s*/, ''),
                    strategy: lines[4]?.replace(/Strateji:\s*/, '')
                };
            });

        return suggestions;
    }

    async generateHashtagRecommendations(caption, competitorHashtags) {
        try {
            const response = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: "Instagram hashtag uzmanı olarak görev yapıyorsun."
                    },
                    {
                        role: "user",
                        content: `
                        Bu içerik için en uygun Instagram hashtaglerini öner:
                        
                        İçerik: ${caption}
                        
                        Rakiplerin kullandığı başarılı hashtagler:
                        ${competitorHashtags.map(tag => `#${tag}`).join(' ')}
                        
                        Lütfen şu kriterlere göre hashtag öner:
                        1. İçerikle alakalı
                        2. Orta düzey rekabet (çok popüler veya çok az kullanılan değil)
                        3. Hedef kitleye uygun
                        4. Trend olan
                        5. Nişe özgü
                        
                        Her hashtag için kullanım sayısı ve tahmini erişim potansiyelini de belirt.
                        `
                    }
                ],
                temperature: 0.7
            });

            return this.parseHashtagRecommendations(response.choices[0].message.content);
        } catch (error) {
            console.error('Hashtag önerisi oluşturma hatası:', error);
            throw error;
        }
    }

    parseHashtagRecommendations(aiResponse) {
        // AI yanıtını yapılandırılmış formata dönüştür
        const recommendations = aiResponse.split('\n')
            .filter(line => line.startsWith('#'))
            .map(line => {
                const [hashtag, ...details] = line.split(' - ');
                return {
                    tag: hashtag.slice(1),
                    details: details.join(' - '),
                    usage_count: this.extractUsageCount(details.join(' ')),
                    reach_potential: this.extractReachPotential(details.join(' '))
                };
            });

        return {
            hashtags: recommendations,
            categories: this.categorizeHashtags(recommendations)
        };
    }

    extractUsageCount(details) {
        const match = details.match(/(\d+[KkMm]?)\s*posts?/);
        return match ? this.normalizeCount(match[1]) : 0;
    }

    extractReachPotential(details) {
        const match = details.match(/(low|medium|high)/i);
        return match ? match[1].toLowerCase() : 'medium';
    }

    normalizeCount(count) {
        if (count.endsWith('K') || count.endsWith('k')) {
            return parseFloat(count) * 1000;
        }
        if (count.endsWith('M') || count.endsWith('m')) {
            return parseFloat(count) * 1000000;
        }
        return parseInt(count);
    }

    categorizeHashtags(hashtags) {
        return {
            niche: hashtags.filter(h => h.usage_count < 100000),
            moderate: hashtags.filter(h => h.usage_count >= 100000 && h.usage_count < 1000000),
            popular: hashtags.filter(h => h.usage_count >= 1000000)
        };
    }
}

module.exports = new AIService(); 