
const PORT = 3001; // Assuming 3001, but will confirm in script
const fetch = require('node-fetch'); // Needs node-fetch or native fetch in newer node

async function verify() {
    console.log('Starting E2E Verification via API...');
    const baseUrl = `http://localhost:${PORT}/api`;

    // 1. Authenticate (Need a user)
    // For this test, I assume there's a user 'admin@example.com' / 'password' or similar.
    // If not, I'll register one.

    let token = '';
    const unique = Date.now();
    const email = `testuser${unique}@example.com`;
    const password = 'password123';

    try {
        console.log('Registering user...');
        const regRes = await fetch(`${baseUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Test User', email, password })
        });
        const regData = await regRes.json();

        if (regData.token) {
            token = regData.token;
        } else {
            console.log('User might exist, trying login...');
            const loginRes = await fetch(`${baseUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const loginData = await loginRes.json();
            token = loginData.token;
        }

        if (!token) throw new Error('Failed to authenticate');
        console.log('Authenticated.');

        // 2. Create Rule
        console.log('Creating Rule...');
        const ruleRes = await fetch(`${baseUrl}/rules`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name: `Rule ${unique}`,
                entity: 'financial',
                metric: 'value',
                operator: '<',
                value: 100,
                priority: 'high'
            })
        });

        if (!ruleRes.ok) throw new Error(`Failed to create rule: ${await ruleRes.text()}`);
        console.log('Rule created.');

        // 3. Create Violation Entry
        console.log('Creating Violation Entry...');
        const entryRes = await fetch(`${baseUrl}/financial`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                type: 'revenue',
                category: 'Test',
                description: 'Test Violation',
                value: 50, // Should trigger < 100
                date: new Date().toISOString()
            })
        });

        if (!entryRes.ok) throw new Error(`Failed to create entry: ${await entryRes.text()}`);
        console.log('Entry created.');

        // 4. Check Alerts
        // Wait a moment for async processing (if any, though it's sync in controller)
        await new Promise(r => setTimeout(r, 1000));

        console.log('Checking Alerts...');
        const alertsRes = await fetch(`${baseUrl}/alerts`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const alerts = await alertsRes.json();

        const triggered = alerts.find((a: any) => a.title.includes(`Rule ${unique}`));

        if (triggered) {
            console.log('SUCCESS: Alert found:', triggered.title);
        } else {
            console.error('FAILURE: Alert not found.', alerts);
            process.exit(1);
        }

    } catch (error) {
        console.error('Test Failed:', error);
        process.exit(1);
    }
}

verify();
