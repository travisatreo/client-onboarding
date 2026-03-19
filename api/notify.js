export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Email not configured' });
    }

    const data = req.body;
    const signed = data.signed ? 'SIGNED' : 'UNSIGNED';
    const rate = parseInt(data.rate_per_song).toLocaleString();
    const total = parseInt(data.total).toLocaleString();
    const deposit = parseInt(data.deposit).toLocaleString();

    const emailHtml = `
        <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a1a; color: #f5f5f5; border-radius: 12px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #6c5ce7, #8b7cf0); padding: 24px 30px;">
                <h1 style="margin: 0; font-size: 20px; color: white;">New Client Onboarding</h1>
                <p style="margin: 4px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">${signed} — ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div style="padding: 24px 30px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 10px 0; color: #888; font-size: 13px;">Client</td><td style="padding: 10px 0; text-align: right; font-weight: 600; font-size: 15px;">${data.client_name}</td></tr>
                    <tr style="border-top: 1px solid #1e1e3a;"><td style="padding: 10px 0; color: #888; font-size: 13px;">Email</td><td style="padding: 10px 0; text-align: right;"><a href="mailto:${data.client_email}" style="color: #a29bfe;">${data.client_email}</a></td></tr>
                    <tr style="border-top: 1px solid #1e1e3a;"><td style="padding: 10px 0; color: #888; font-size: 13px;">Project</td><td style="padding: 10px 0; text-align: right; font-weight: 600;">${data.project_name}</td></tr>
                    <tr style="border-top: 1px solid #1e1e3a;"><td style="padding: 10px 0; color: #888; font-size: 13px;">Songs</td><td style="padding: 10px 0; text-align: right;">${data.num_songs}</td></tr>
                    <tr style="border-top: 1px solid #1e1e3a;"><td style="padding: 10px 0; color: #888; font-size: 13px;">Rate</td><td style="padding: 10px 0; text-align: right;">$${rate}/song</td></tr>
                    <tr style="border-top: 1px solid #1e1e3a;"><td style="padding: 10px 0; color: #888; font-size: 13px;">Start Date</td><td style="padding: 10px 0; text-align: right;">${data.start_date}</td></tr>
                    <tr style="border-top: 1px solid #1e1e3a;"><td style="padding: 10px 0; color: #888; font-size: 13px;">Notes</td><td style="padding: 10px 0; text-align: right;">${data.notes || '—'}</td></tr>
                </table>
                <div style="margin-top: 20px; padding: 16px; background: #111128; border-radius: 8px; border: 1px solid rgba(200,168,81,0.2);">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color: #888; font-size: 13px;">Total</span>
                        <span style="font-weight: 700; font-size: 16px;">$${total}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #c8a851; font-weight: 600; font-size: 13px;">Security Deposit (50%)</span>
                        <span style="color: #c8a851; font-weight: 700; font-size: 18px;">$${deposit}</span>
                    </div>
                </div>
                <div style="margin-top: 20px; padding: 12px 16px; background: ${data.signed ? '#1a3a1a' : '#3a2a1a'}; border-radius: 8px; text-align: center;">
                    <span style="font-size: 13px; color: ${data.signed ? '#4ade80' : '#fbbf24'};">
                        ${data.signed ? '✓ Contract signed electronically' : '⏳ Contract sent unsigned — follow up for signature'}
                    </span>
                </div>
            </div>
        </div>
    `;

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'Travis Atreo Onboarding <onboarding@resend.dev>',
                to: process.env.NOTIFY_EMAIL || 'travis@travisatreo.com',
                subject: `New Client: ${data.client_name} — ${data.project_name} ($${deposit} deposit)`,
                html: emailHtml,
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            console.error('Resend error:', err);
            return res.status(500).json({ error: 'Failed to send' });
        }

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('Notify error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
}
