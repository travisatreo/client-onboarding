// Post-onboarding async hook
// Called after client submission — triggers Drive folder + SMS notifications
// Runs in the background (client doesn't wait for these)
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { client_id, client_name, client_phone, project_name, deposit, total } = req.body;
    const baseUrl = `https://${req.headers.host}`;
    const results = { drive: null, sms_producer: null, sms_client: null };

    // 1. Auto-create Google Drive folder (if enabled)
    if (process.env.ENABLE_DRIVE === 'true' && process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        try {
            const driveResp = await fetch(`${baseUrl}/api/drive`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.DASHBOARD_PASSWORD}`,
                },
                body: JSON.stringify({ client_name, project_name, client_id }),
            });
            results.drive = await driveResp.json();
        } catch (err) {
            console.error('Post-onboard drive error:', err);
            results.drive = { ok: false, error: err.message };
        }
    }

    // 2. Send SMS notifications (if enabled)
    if (process.env.ENABLE_SMS === 'true' && process.env.TWILIO_ACCOUNT_SID) {
        try {
            const smsResp = await fetch(`${baseUrl}/api/sms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'new_client',
                    to: client_phone || null,
                    client_name,
                    project_name,
                    deposit,
                    total,
                    drive_url: results.drive?.folder_url || null,
                }),
            });
            results.sms_producer = await smsResp.json();
        } catch (err) {
            console.error('Post-onboard sms error:', err);
            results.sms_producer = { ok: false, error: err.message };
        }
    }

    return res.status(200).json({ ok: true, results });
}
