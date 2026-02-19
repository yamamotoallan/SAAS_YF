
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001/api';

async function verify() {
    console.log('🔒 Verifying RBAC...');

    // 1. Register a regular user (Viewer)
    // We'll mimic the register endpoint but since we can't easily force role='viewer' via public API (it defaults to admin in some logic or we need to check how register works),
    // actually register defaults to 'admin' in the current code:
    // "role: 'admin'" in auth.ts line 88.
    // So I need to MANUALLY create a viewer token or user for this test.
    // Or, I can use the existing admin token and verify I CAN do things, 
    // AND then try with a made-up token or a user I downgrade in DB.

    // Let's rely on the fact I can create a user and then manually downgrade them in DB via Prisma for the test.
    const unique = Date.now();
    const email = `viewer_${unique}@test.com`;
    const password = 'password123';

    // Register (will be admin initially)
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Viewer User',
            email,
            password,
            companyName: `Company ${unique}`
        })
    });

    const regData = await regRes.json();
    if (!regData.token) {
        console.error('Failed to register:', regData);
        return;
    }

    console.log('👤 User registered (initially admin).');

    // 2. Downgrade user to 'viewer' directly in DB (using Prisma would be ideal but let's try to assume we have access or restart server logic... wait, I can use Prisma here directly)
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    await prisma.user.update({
        where: { id: regData.user.id },
        data: { role: 'viewer' }
    });
    console.log('⬇️ User downgraded to "viewer".');

    // 3. Login again to get new token with 'viewer' role (since role is encoded in token)
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;

    // Check if token has role (we can decode or just trust the next steps)
    console.log('🔑 Got new token.');

    // 4. Try to CREATE a Rule (Should FAIL)
    console.log('🚫 Attempting to CREATE Rule (Expected: 403)...');
    const ruleRes = await fetch(`${BASE_URL}/rules`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            name: 'Illegal Rule',
            entity: 'financial',
            metric: 'value',
            operator: '>',
            value: 100
        })
    });

    if (ruleRes.status === 403) {
        console.log('✅ Success: Blocked with 403.');
    } else {
        console.error(`❌ Failed: Expected 403, got ${ruleRes.status}`);
    }

    // 5. Try to GET Rules (Should SUCCEED - Viewers can see)
    console.log('👀 Attempting to GET Rules (Expected: 200)...');
    const getRes = await fetch(`${BASE_URL}/rules`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (getRes.status === 200) {
        console.log('✅ Success: Allowed with 200.');
    } else {
        console.error(`❌ Failed: Expected 200, got ${getRes.status}`);
    }

    // 6. Try to UPDATE Company (Should FAIL)
    console.log('🚫 Attempting to UPDATE Company (Expected: 403)...');
    const companyRes = await fetch(`${BASE_URL}/company`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: 'Hacked Company' })
    });

    if (companyRes.status === 403) {
        console.log('✅ Success: Blocked with 403.');
    } else {
        console.error(`❌ Failed: Expected 403, got ${companyRes.status}`);
    }
}

verify().catch(console.error);
