import BandwidthUsage from '../../domain/value-objects/BandwidthUsage.js';

export default class BandwidthMonitoringService {
  constructor({ bandwidthRepository = null, cdnService = null } = {}) {
    this.bandwidthRepository = bandwidthRepository;
    this.cdnService = cdnService;
  }

  async recordUsage(products) {
    const usage = new BandwidthUsage();
    for (const p of products || []) {
      usage.add({ bytes: p?.optimizedPhoto?.bytes || 0, count: 1 });
    }

    if (this.bandwidthRepository) {
      await this.bandwidthRepository.record({
        timestamp: new Date(),
        bytes: usage.bytes,
        count: usage.count
      });
    }

    if (usage.bytes > this.getDailyThreshold() && this.cdnService?.invalidate) {
      try {
        await this.cdnService.invalidate(['/assets/*']);
      } catch (_) {
        // swallow CDN errors for now
      }
    }

    return usage;
  }

  recordUpload(originalBytes, optimizedBytes) {
    // Placeholder hook for upload path; can persist later
    return { originalBytes, optimizedBytes };
  }

  getDailyThreshold() {
    return 200 * 1024 * 1024; // 200MB default threshold
  }
}
