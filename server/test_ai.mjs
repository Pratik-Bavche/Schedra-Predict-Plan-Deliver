import dotenv from 'dotenv';
dotenv.config();

const key = process.env.OPENROUTER_API_KEY;
console.log(`API Key: ${key ? 'LOADED (length=' + key.length + ')' : 'MISSING!'}`);

const models = [
    'tencent/hy3:free',
    'nvidia/nemotron-3-ultra-550b-a55b:free',
];

for (const model of models) {
    console.log(`\n--- Testing model: ${model} ---`);
    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://schedra.app',
                'X-Title': 'Schedra'
            },
            body: JSON.stringify({
                model,
                max_tokens: 100,
                response_format: { type: 'json_object' },
                messages: [{ role: 'user', content: 'Return exactly: {"status":"ok","model":"working"}' }]
            })
        });

        console.log('HTTP Status:', response.status, response.statusText);
        const data = await response.json();
        if (data.error) {
            console.error('API Error:', JSON.stringify(data.error));
        } else {
            console.log('Content:', data.choices?.[0]?.message?.content);
            console.log('SUCCESS ✅');
            break; // stop at first working model
        }
    } catch (err) {
        console.error('Fetch error:', err.message);
    }
}
