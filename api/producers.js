// Producers list endpoint — reads .producers/ directory
// Returns all deployed producer instances for the admin dashboard
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const producersDir = join(process.cwd(), '.producers');

    if (!existsSync(producersDir)) {
        // No producers directory — return current instance from config
        return res.status(200).json([{
            name: process.env.PRODUCER_NAME || 'Travis Atreo Productions',
            slug: process.env.PRODUCER_SLUG || 'travisatreo',
            email: process.env.PRODUCER_EMAIL || '',
            rate: parseInt(process.env.RATE_PER_SONG || '1500'),
            payment_method: process.env.PAYMENT_METHOD || 'zelle',
            enable_drive: process.env.ENABLE_DRIVE === 'true',
            enable_sms: process.env.ENABLE_SMS === 'true',
            deploy_url: `https://${req.headers.host}`,
        }]);
    }

    try {
        const files = readdirSync(producersDir).filter(f => f.endsWith('.json'));
        const producers = files.map(f => {
            const data = JSON.parse(readFileSync(join(producersDir, f), 'utf8'));
            return data;
        });
        return res.status(200).json(producers);
    } catch (err) {
        console.error('Producers list error:', err);
        return res.status(500).json({ error: 'Failed to read producers' });
    }
}
