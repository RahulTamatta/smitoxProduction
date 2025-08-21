export const detectConnectionQuality = (req, res, next) => {
  const connectionQuality = req.headers['device-memory'] && req.headers['rtt']
    ? determineQualityFromNetworkHints(req.headers)
    : req.cookies?.connectionQuality || '4g';

  req.connectionQuality = connectionQuality;
  next();
};

function determineQualityFromNetworkHints(headers) {
  const rtt = parseInt(headers['rtt']);
  const deviceMemory = parseFloat(headers['device-memory']);

  if (Number.isFinite(rtt)) {
    if (rtt > 300) return 'slow-2g';
    if (rtt > 150) return '2g';
    if (rtt > 50) return '3g';
  }
  return '4g';
}
