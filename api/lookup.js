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

    const { phone } = req.body || {};
    if (!phone) {
        return res.status(400).json({ error: 'Phone number required' });
    }

    // Strip non-digits
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
        return res.status(400).json({ error: 'Invalid phone number' });
    }

    try {
        // Producer slug scoping
        const producerSlug = process.env.PRODUCER_SLUG;
        const slugFilter = producerSlug ? `&producer_slug=eq.${producerSlug}` : '';

        // Fetch all clients that have a phone number
        const response = await fetch(
            `${supabaseUrl}/rest/v1/clients?phone=not.is.null&order=created_at.desc&select=id,client_name,project_name,status,drive_folder_url,created_at,phone${slugFilter}`,
            {
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            const err = await response.text();
            console.error('Supabase lookup error:', err);
            return res.status(500).json({ error: 'Lookup failed' });
        }

        const allClients = await response.json();

        // Filter by matching digits (strip formatting from stored phone)
        const clients = allClients.filter(c => {
            const storedDigits = (c.phone || '').replace(/\D/g, '');
            return storedDigits === digits || storedDigits.endsWith(digits) || digits.endsWith(storedDigits);
        }).map(({ phone, ...rest }) => rest); // Don't expose phone in response

        return res.status(200).json({ clients });
    } catch (err) {
        console.error('Lookup error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
}
