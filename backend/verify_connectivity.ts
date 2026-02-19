
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001/api';

async function checkHealth() {
    try {
        console.log(`📡 Checking connectivity to ${BASE_URL}...`);

        // Try a simple public endpoint or just root
        // Since we have authentication, maybe /auth/me or just / (if exists)
        // Let's try /financial/summary with a token if we can, or just expect 401 which means server IS up.
        const res = await fetch(`${BASE_URL}/financial`);

        console.log(`Response Status: ${res.status}`);
        if (res.status === 401) {
            console.log('✅ Server is UP and responding (Authorized required).');
        } else if (res.ok) {
            console.log('✅ Server is UP and responding (200 OK).');
        } else {
            console.log(`⚠️ Server responding with ${res.status}`);
        }
    } catch (error) {
        console.error('❌ Connection Failed:', error.code || error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('SERVER APPEARS DOWN. Please restart "npm run dev".');
        }
    }
}

checkHealth();
