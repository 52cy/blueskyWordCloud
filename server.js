import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Host Static Files from 'dist' (Vite Build Output)
app.use(express.static(path.join(__dirname, 'dist')));

// Proxy /xrpc requests to Bluesky
// This matches the setup in vite.config.js but for production
app.use('/xrpc', createProxyMiddleware({
    target: 'https://bsky.social',
    changeOrigin: true,
    secure: false,
    logLevel: 'debug',
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[Proxy] Proxying ${req.method} request to: ${proxyReq.host}${proxyReq.path}`);
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log(`[Proxy] Received response from target: ${proxyRes.statusCode}`);
    },
    onError: (err, req, res) => {
        console.error('[Proxy] Error:', err);
    }
}));

// Handle SPA Routing: Return index.html for all other non-API routes
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
