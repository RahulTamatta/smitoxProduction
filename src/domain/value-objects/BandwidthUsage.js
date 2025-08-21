export default class BandwidthUsage {
  constructor({ timestamp = new Date(), bytes = 0, count = 0 } = {}) {
    this.timestamp = timestamp instanceof Date ? timestamp : new Date(timestamp);
    this.bytes = Number(bytes) || 0;
    this.count = Number(count) || 0;
  }

  add({ bytes = 0, count = 1 } = {}) {
    this.bytes += Number(bytes) || 0;
    this.count += Number(count) || 0;
    return this;
  }

  get averageBytesPerItem() {
    return this.count > 0 ? Math.round(this.bytes / this.count) : 0;
  }
}
