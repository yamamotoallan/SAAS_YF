import fetch from 'node-fetch';

/**
 * Service to keep the backend alive on platforms like Railway by periodically
 * pinging its own health check endpoint.
 */
export function startKeepAlive() {
    const BACKEND_URL = process.env.BACKEND_URL ||
        process.env.RAILWAY_STATIC_URL ||
        `http://localhost:${process.env.PORT || 3001}`;

    const HEALTH_ENDPOINT = `${BACKEND_URL.replace(/\/$/, '')}/api/health`;

    // 14 minutes interval (Railway sleeps after ~15-30 mins of inactivity)
    const INTERVAL = 14 * 60 * 1000;

    console.log(`[Keep-Alive] Starting service. Target: ${HEALTH_ENDPOINT}`);

    setInterval(async () => {
        try {
            const response = await fetch(HEALTH_ENDPOINT);
            if (response.ok) {
                const data = await response.json();
                console.log(`[Keep-Alive] Ping successful at ${new Date().toISOString()}:`, data);
            } else {
                console.warn(`[Keep-Alive] Ping failed with status ${response.status} at ${new Date().toISOString()}`);
            }
        } catch (error) {
            console.error(`[Keep-Alive] Error during ping at ${new Date().toISOString()}:`, error instanceof Error ? error.message : error);
        }
    }, INTERVAL);
}
