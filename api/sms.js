// Twilio SMS notifications for producer + client
// Sends notifications on: new onboarding, deposit received, files ready
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    const producerPhone = process.env.PRODUCER_PHONE;

    if (!accountSid || !authToken || !fromNumber) {
        return res.status(500).json({ error: 'SMS not configured' });
    }

    const { type, to, client_name, project_name, deposit, total, drive_url } = req.body;

    if (!type) return res.status(400).json({ error: 'Notification type required' });

    const producerName = process.env.PRODUCER_NAME || 'Your producer';
    const messages = [];

    switch (type) {
        case 'new_client': {
            // Notify producer about new onboarding
            if (producerPhone) {
                messages.push({
                    to: producerPhone,
                    body: `🎵 New client onboarded!\n\n${client_name} — ${project_name}\n${deposit ? `Deposit: $${parseInt(deposit).toLocaleString()}` : ''}\nTotal: $${parseInt(total).toLocaleString()}\n\nCheck your dashboard for details.`,
                });
            }
            // Confirm to client
            if (to) {
                messages.push({
                    to,
                    body: `Hey ${client_name}! 🎶\n\nYou're all set with ${producerName}. Your project "${project_name}" is locked in.\n\n${deposit ? `Security deposit: $${parseInt(deposit).toLocaleString()} via Zelle.` : ''}\n\nWe'll be in touch soon!`,
                });
            }
            break;
        }

        case 'deposit_received': {
            if (to) {
                messages.push({
                    to,
                    body: `✅ Deposit received!\n\nHey ${client_name}, your deposit for "${project_name}" has been confirmed. Production is underway!\n\n— ${producerName}`,
                });
            }
            break;
        }

        case 'files_ready': {
            if (to) {
                messages.push({
                    to,
                    body: `🎧 Your files are ready!\n\nHey ${client_name}, the files for "${project_name}" are ready for you.${drive_url ? `\n\nAccess them here:\n${drive_url}` : ''}\n\n— ${producerName}`,
                });
            }
            break;
        }

        case 'custom': {
            const { message } = req.body;
            if (to && message) {
                messages.push({ to, body: message });
            }
            break;
        }

        default:
            return res.status(400).json({ error: `Unknown type: ${type}` });
    }

    if (messages.length === 0) {
        return res.status(400).json({ error: 'No messages to send (missing phone numbers)' });
    }

    const results = [];
    for (const msg of messages) {
        try {
            const resp = await fetch(
                `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        To: msg.to,
                        From: fromNumber,
                        Body: msg.body,
                    }),
                }
            );

            if (!resp.ok) {
                const err = await resp.text();
                console.error('Twilio error:', err);
                results.push({ to: msg.to, ok: false, error: err });
            } else {
                const data = await resp.json();
                results.push({ to: msg.to, ok: true, sid: data.sid });
            }
        } catch (err) {
            console.error('SMS send error:', err);
            results.push({ to: msg.to, ok: false, error: err.message });
        }
    }

    return res.status(200).json({ ok: true, results });
}
