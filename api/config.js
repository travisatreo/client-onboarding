// Producer config endpoint — returns branding/settings from env vars
// Every producer instance has its own Vercel project with these env vars set
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const config = {
        // Branding
        producer_name: process.env.PRODUCER_NAME || 'Travis Atreo Productions',
        producer_slug: process.env.PRODUCER_SLUG || 'travisatreo',
        tagline: process.env.PRODUCER_TAGLINE || 'Music Production for Artists & Labels',
        legal_name: process.env.PRODUCER_LEGAL_NAME || 'Travis Graham',
        legal_dba: process.env.PRODUCER_LEGAL_DBA || 'Travis Atreo Productions',
        contact_email: process.env.PRODUCER_EMAIL || 'travis@travisatreo.com',

        // Colors
        accent_color: process.env.ACCENT_COLOR || '#c8a851',
        accent_light: process.env.ACCENT_LIGHT || '#e8d5a3',
        secondary_color: process.env.SECONDARY_COLOR || '#6c5ce7',
        secondary_light: process.env.SECONDARY_LIGHT || '#8b7cf0',

        // Rates
        rate_per_song: parseInt(process.env.RATE_PER_SONG || '1500'),
        min_rate: parseInt(process.env.MIN_RATE || '1000'),
        deposit_percent: parseInt(process.env.DEPOSIT_PERCENT || '50'),

        // Payment
        payment_method: process.env.PAYMENT_METHOD || 'zelle',
        payment_name: process.env.PAYMENT_NAME || 'Travis Graham',
        payment_handle: process.env.PAYMENT_HANDLE || '',
        zelle_qr_url: process.env.ZELLE_QR_URL || '',

        // Features
        enable_drive: process.env.ENABLE_DRIVE === 'true',
        enable_sms: process.env.ENABLE_SMS === 'true',
        enable_booking: process.env.ENABLE_BOOKING === 'true',
        booking_url: process.env.BOOKING_URL || '',

        // Credit line
        credit_line: process.env.CREDIT_LINE || 'Produced by Travis Atreo',
    };

    return res.status(200).json(config);
}
