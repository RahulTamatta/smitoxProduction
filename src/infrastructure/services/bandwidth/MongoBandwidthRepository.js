export default class MongoBandwidthRepository {
  constructor({ Model }) {
    this.Model = Model; // expects a Mongoose model
  }

  async record({ timestamp, bytes, count }) {
    if (!this.Model) return;
    await this.Model.create({ timestamp, bytes, count });
  }
}
