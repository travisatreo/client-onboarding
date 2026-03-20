// Google Drive folder creation on client onboarding
// Creates: Producer Root > Client Name - Project Name
// Requires: GOOGLE_SERVICE_ACCOUNT_KEY (JSON), GOOGLE_DRIVE_ROOT_FOLDER_ID
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // Auth — same dashboard password
    const dashPassword = process.env.DASHBOARD_PASSWORD;
    const authHeader = req.headers.authorization;
    if (!dashPassword || authHeader !== `Bearer ${dashPassword}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const serviceKeyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

    if (!serviceKeyJson || !rootFolderId) {
        return res.status(500).json({ error: 'Google Drive not configured' });
    }

    const { client_name, project_name, client_id } = req.body;
    if (!client_name || !project_name) {
        return res.status(400).json({ error: 'client_name and project_name required' });
    }

    try {
        const serviceKey = JSON.parse(serviceKeyJson);
        const accessToken = await getAccessToken(serviceKey);

        // Create client project folder inside root
        const folderName = `${client_name} — ${project_name}`;
        const folder = await createFolder(accessToken, folderName, rootFolderId);

        // Create subfolders for organization
        const subfolders = ['Stems', 'Masters', 'References', 'Notes'];
        for (const sub of subfolders) {
            await createFolder(accessToken, sub, folder.id);
        }

        const folderUrl = `https://drive.google.com/drive/folders/${folder.id}`;

        // If client_id provided, update the client record with the drive folder URL
        if (client_id) {
            const supabaseUrl = process.env.SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
            if (supabaseUrl && supabaseKey) {
                await fetch(`${supabaseUrl}/rest/v1/clients?id=eq.${client_id}`, {
                    method: 'PATCH',
                    headers: {
                        'apikey': supabaseKey,
                        'Authorization': `Bearer ${supabaseKey}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation',
                    },
                    body: JSON.stringify({ drive_folder_url: folderUrl }),
                });
            }
        }

        return res.status(200).json({ ok: true, folder_id: folder.id, folder_url: folderUrl });
    } catch (err) {
        console.error('Drive error:', err);
        return res.status(500).json({ error: 'Failed to create Drive folder' });
    }
}

// Get OAuth2 access token from service account JWT
async function getAccessToken(serviceKey) {
    const now = Math.floor(Date.now() / 1000);
    const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
        iss: serviceKey.client_email,
        scope: 'https://www.googleapis.com/auth/drive',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now,
    }));

    const signInput = `${header}.${payload}`;

    // Import the private key and sign
    const key = await crypto.subtle.importKey(
        'pkcs8',
        pemToBuffer(serviceKey.private_key),
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signInput));
    const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const jwt = `${signInput}.${sig}`;

    const resp = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    if (!resp.ok) throw new Error(`Token error: ${await resp.text()}`);
    const data = await resp.json();
    return data.access_token;
}

function pemToBuffer(pem) {
    const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
}

async function createFolder(accessToken, name, parentId) {
    const resp = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentId],
        }),
    });
    if (!resp.ok) throw new Error(`Drive create error: ${await resp.text()}`);
    return resp.json();
}
