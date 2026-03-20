const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch'); // node-fetch might not be installed but global fetch works in Node 18+

const prisma = new PrismaClient();

async function run() {
    const user = await prisma.user.findFirst();
    if (!user) {
        console.log("No user found");
        return;
    }

    const token = jwt.sign(
        { id: user.id, companyId: user.companyId, role: user.role },
        process.env.JWT_SECRET || 'fallback_secret', // If .env isn't loaded, wait, I need dotenv.
        { expiresIn: '1d' }
    );

    console.log(`Using token for user: ${user.email}, company: ${user.companyId}`);
    
    try {
        const response = await fetch('http://localhost:5000/api/ceo-mind', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        console.log("STATUS:", response.status);
        if (response.status !== 200) {
            console.log("ERROR PAYLOAD:", data);
        } else {
            console.log("SUCCESS:", Object.keys(data));
        }
    } catch(err) {
        console.error("FETCH ERR:", err);
    }
    
    await prisma.$disconnect();
}

// Load env
require('dotenv').config();
run();
