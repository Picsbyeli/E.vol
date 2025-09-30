#!/usr/bin/env node

// Test script to verify DeepSeek API connectivity
import 'dotenv/config';
import fetch from 'node-fetch';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

async function testDeepSeekAPI() {
    console.log('🧪 Testing DeepSeek API Connection...\n');
    
    if (!DEEPSEEK_API_KEY) {
        console.error('❌ DeepSeek API key not found in environment variables');
        console.log('Please set DEEPSEEK_API_KEY or VITE_DEEPSEEK_API_KEY');
        process.exit(1);
    }
    
    console.log('✅ API Key found:', DEEPSEEK_API_KEY.slice(0, 8) + '...');
    
    try {
        console.log('📡 Making test request to DeepSeek API...');
        
        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'user',
                        content: 'Generate a simple riddle for the E.Vol gaming platform. Return a JSON object with "question", "answer", and "hint" fields.'
                    }
                ],
                max_tokens: 300,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        console.log('✅ API Response successful!');
        console.log('📊 Usage:', {
            prompt_tokens: data.usage?.prompt_tokens || 'N/A',
            completion_tokens: data.usage?.completion_tokens || 'N/A',
            total_tokens: data.usage?.total_tokens || 'N/A'
        });
        
        const content = data.choices?.[0]?.message?.content;
        if (content) {
            console.log('\n🎮 Generated Content:');
            console.log(content);
            
            // Try to parse JSON if it's there
            try {
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    console.log('\n📝 Parsed JSON:');
                    console.log(JSON.stringify(parsed, null, 2));
                }
            } catch (parseError) {
                console.log('ℹ️  Content is not in JSON format (that\'s okay)');
            }
        }
        
        console.log('\n🎉 DeepSeek API is working perfectly for E.Vol!');
        
    } catch (error) {
        console.error('❌ API Test Failed:', error.message);
        
        if (error.message.includes('401')) {
            console.log('💡 Check your API key - it might be invalid or expired');
        } else if (error.message.includes('429')) {
            console.log('💡 Rate limit reached - wait a moment and try again');
        } else if (error.message.includes('fetch')) {
            console.log('💡 Network error - check your internet connection');
        }
        
        process.exit(1);
    }
}

// Run the test
testDeepSeekAPI();