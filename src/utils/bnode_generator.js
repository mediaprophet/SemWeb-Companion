// src/utils/bnode_generator.js
// Shared blank node generator for consistent labeling across all handlers

export class BNodeGenerator {
  constructor(prefix = 'bb') {
    this.prefix = prefix;
    this.counter = 0;
    this.map = new Map();
  }

  get(id) {
    if (!id) return this.new();
    if (!this.map.has(id)) {
      this.counter++;
      this.map.set(id, `_:${this.prefix}${this.counter}`);
    }
    return this.map.get(id);
  }

  new() {
    this.counter++;
    const label = `_:${this.prefix}${this.counter}`;
    this.map.set(label, label);
    return label;
  }

  reset() {
    this.counter = 0;
    this.map.clear();
  }
}
