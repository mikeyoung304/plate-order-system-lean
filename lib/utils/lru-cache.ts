/**
 * Simple LRU (Least Recently Used) Cache implementation
 * Used to prevent memory leaks in WebSocket connections
 */

export class LRUCache<K, V> {
  private maxSize: number
  private cache: Map<K, V>
  private accessOrder: K[]

  constructor(maxSize: number) {
    this.maxSize = maxSize
    this.cache = new Map()
    this.accessOrder = []
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key)
    if (value !== undefined) {
      // Move to end (most recently used)
      this.updateAccessOrder(key)
    }
    return value
  }

  set(key: K, value: V): void {
    // If key exists, update it
    if (this.cache.has(key)) {
      this.cache.set(key, value)
      this.updateAccessOrder(key)
      return
    }

    // If at capacity, remove least recently used
    if (this.cache.size >= this.maxSize) {
      const lru = this.accessOrder.shift()
      if (lru !== undefined) {
        this.cache.delete(lru)
      }
    }

    // Add new item
    this.cache.set(key, value)
    this.accessOrder.push(key)
  }

  delete(key: K): boolean {
    const index = this.accessOrder.indexOf(key)
    if (index > -1) {
      this.accessOrder.splice(index, 1)
    }
    return this.cache.delete(key)
  }

  has(key: K): boolean {
    return this.cache.has(key)
  }

  clear(): void {
    this.cache.clear()
    this.accessOrder = []
  }

  get size(): number {
    return this.cache.size
  }

  entries(): IterableIterator<[K, V]> {
    return this.cache.entries()
  }

  keys(): IterableIterator<K> {
    return this.cache.keys()
  }

  values(): IterableIterator<V> {
    return this.cache.values()
  }

  forEach(callback: (value: V, key: K) => void): void {
    this.cache.forEach(callback)
  }

  private updateAccessOrder(key: K): void {
    const index = this.accessOrder.indexOf(key)
    if (index > -1) {
      this.accessOrder.splice(index, 1)
    }
    this.accessOrder.push(key)
  }
}