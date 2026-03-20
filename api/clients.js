export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();

    // Simple password auth
    const dashPassword = process.env.DASHBOARD_PASSWORD;
    const authHeader = req.headers.authorization;
    if (!dashPassword || authHeader !== `Bearer ${dashPassword}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: 'Database not configured' });
    }

    const headers = {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
    };

    // Producer slug scoping — each producer only sees their own clients
    const producerSlug = process.env.PRODUCER_SLUG;
    const slugFilter = producerSlug ? `&producer_slug=eq.${producerSlug}` : '';

    // GET - list all clients
    if (req.method === 'GET') {
        try {
            const response = await fetch(
                `${supabaseUrl}/rest/v1/clients?order=created_at.desc${slugFilter}`,
                { headers }
            );
            if (!response.ok) {
                const err = await response.text();
                console.error('Supabase fetch error:', err);
                return res.status(500).json({ error: 'Failed to fetch' });
            }
            const clients = await response.json();
            return res.status(200).json(clients);
        } catch (err) {
            console.error('Clients GET error:', err);
            return res.status(500).json({ error: 'Server error' });
        }
    }

    // PATCH - update a client (status, deposit_paid, final_paid)
    if (req.method === 'PATCH') {
        const { id, ...updates } = req.body;
        if (!id) return res.status(400).json({ error: 'Missing client id' });

        // Only allow safe fields to be updated
        const allowed = ['status', 'deposit_paid', 'final_paid', 'notes', 'drive_folder_url', 'phone', 'birthday'];
        const safeUpdates = {};
        for (const key of allowed) {
            if (updates[key] !== undefined) safeUpdates[key] = updates[key];
        }

        try {
            const response = await fetch(
                `${supabaseUrl}/rest/v1/clients?id=eq.${id}`,
                {
                    method: 'PATCH',
                    headers: { ...headers, 'Prefer': 'return=representation' },
                    body: JSON.stringify(safeUpdates),
                }
            );
            if (!response.ok) {
                const err = await response.text();
                console.error('Supabase update error:', err);
                return res.status(500).json({ error: 'Failed to update' });
            }
            const result = await response.json();
            return res.status(200).json(result[0] || {});
        } catch (err) {
            console.error('Clients PATCH error:', err);
            return res.status(500).json({ error: 'Server error' });
        }
    }

    // DELETE - remove a client
    if (req.method === 'DELETE') {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: 'Missing client id' });

        try {
            const response = await fetch(
                `${supabaseUrl}/rest/v1/clients?id=eq.${id}`,
                { method: 'DELETE', headers }
            );
            if (!response.ok) {
                const err = await response.text();
                console.error('Supabase delete error:', err);
                return res.status(500).json({ error: 'Failed to delete' });
            }
            return res.status(200).json({ ok: true });
        } catch (err) {
            console.error('Clients DELETE error:', err);
            return res.status(500).json({ error: 'Server error' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
