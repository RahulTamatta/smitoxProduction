export default class ImageOptimizationPolicy {
  static getOptimalQuality(connectionType) {
    const QUALITY_MAP = {
      'slow-2g': 50,
      '2g': 60,
      '3g': 75,
      '4g': 85,
      wifi: 90
    };
    return QUALITY_MAP[connectionType] ?? 75;
  }

  static getOptimalSize(deviceType) {
    const map = {
      mobile: { width: 800, height: 600 },
      tablet: { width: 1200, height: 900 },
      desktop: { width: 1920, height: 1080 }
    };
    return map[deviceType] ?? { width: 1200, height: 900 };
  }
}
