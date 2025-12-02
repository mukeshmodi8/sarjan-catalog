// server/routes/imageProxy.js  (ESM)
import express from 'express';
import fetch from 'node-fetch'; // node 18+ में global fetch है, पर पुरानी वर्ज़न में node-fetch उपयोग करो
const router = express.Router();

router.get('/image-proxy', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).send('Missing url');

    // Basic check: allow only http(s)
    if (!/^https?:\/\//i.test(url)) return res.status(400).send('Invalid url');

    const r = await fetch(url);
    if (!r.ok) return res.status(502).send('Remote fetch failed');

    // copy headers that are safe (content-type, cache-control)
    res.set('Content-Type', r.headers.get('content-type') || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400');
    // IMPORTANT: allow CORS so browser + html2canvas can use it
    res.set('Access-Control-Allow-Origin', '*');

    const buffer = await r.arrayBuffer();
    res.status(200).send(Buffer.from(buffer));
  } catch (err) {
    console.error('proxy error', err);
    res.status(500).send('Proxy error');
  }
});

export default router;
