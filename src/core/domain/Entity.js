export default class Entity {
  constructor(props = {}) {
    this.id = props.id || props._id || null;
  }

  equals(other) {
    if (!other) return false;
    return String(this.id) === String(other.id);
  }
}
