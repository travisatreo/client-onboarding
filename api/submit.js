export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase env vars');
        return res.status(500).json({ error: 'Database not configured' });
    }

    const data = req.body;

    const row = {
        client_name: data.client_name,
        client_email: data.client_email,
        project_name: data.project_name,
        num_songs: parseInt(data.num_songs),
        rate_per_song: parseFloat(data.rate_per_song),
        total: parseFloat(data.total),
        deposit: parseFloat(data.deposit),
        start_date: data.start_date || null,
        notes: data.notes || null,
        signed: !!data.signed,
        invoice_number: data.invoice_number || null,
        signed_at: data.signed ? new Date().toISOString() : null,
    };

    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/clients`, {
            method: 'POST',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation',
            },
            body: JSON.stringify(row),
        });

        if (!response.ok) {
            const err = await response.text();
            console.error('Supabase insert error:', err);
            return res.status(500).json({ error: 'Failed to save' });
        }

        const result = await response.json();
        return res.status(200).json({ ok: true, id: result[0]?.id });
    } catch (err) {
        console.error('Submit error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
}
