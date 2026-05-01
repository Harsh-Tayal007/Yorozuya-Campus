import { get, set, del, keys } from "idb-keyval"

// Prefix to separate our mascot assets from other things in indexedDB
const CACHE_PREFIX = "mascot_asset_"
const META_PREFIX  = "mascot_meta_"

/**
 * Mascot Asset Cache Manager
 * Handles downloading, storing, and retrieving large VRM/VRMA files using IndexedDB
 * to save bandwidth and improve load times.
 */
class AssetCacheManager {
  /**
   * Generates a cache key for a given URL
   */
  _getKey(url) {
    // Basic hash or just the filename if URLs are clean
    const filename = url.split('/').pop().split('?')[0]
    return `${CACHE_PREFIX}${filename}`
  }

  _getMetaKey(url) {
    const filename = url.split('/').pop().split('?')[0]
    return `${META_PREFIX}${filename}`
  }

  /**
   * Check if a file is already in the local cache
   */
  async isCached(url) {
    const key = this._getKey(url)
    try {
      const exists = await get(key)
      return !!exists
    } catch (err) {
      console.warn("AssetCacheManager: Failed to check cache status", err)
      return false
    }
  }

  /**
   * Get all cached assets metadata (for Settings UI)
   */
  async getCachedAssets() {
    try {
      const allKeys = await keys()
      const metaKeys = allKeys.filter(k => typeof k === 'string' && k.startsWith(META_PREFIX))
      
      const assets = []
      for (const k of metaKeys) {
        const meta = await get(k)
        if (meta) assets.push(meta)
      }
      return assets
    } catch (err) {
      console.error("AssetCacheManager: Failed to list cached assets", err)
      return []
    }
  }

  /**
   * Delete a specific asset from cache
   */
  async deleteAsset(url) {
    try {
      await del(this._getKey(url))
      await del(this._getMetaKey(url))
      return true
    } catch (err) {
      console.error("AssetCacheManager: Failed to delete asset", err)
      return false
    }
  }

  /**
   * Clear all mascot assets from cache
   */
  async clearAll() {
    try {
      const allKeys = await keys()
      const targetKeys = allKeys.filter(k => typeof k === 'string' && (k.startsWith(CACHE_PREFIX) || k.startsWith(META_PREFIX)))
      for (const k of targetKeys) {
        await del(k)
      }
      return true
    } catch (err) {
      console.error("AssetCacheManager: Failed to clear cache", err)
      return false
    }
  }

  /**
   * Get an object URL for the cached file.
   * Downloads and caches it first if not present.
   * @param {string} url - The remote URL
   * @param {string} name - Friendly name for metadata
   * @param {string} type - 'character' | 'animation'
   * @param {function} onProgress - Optional callback for download progress (0-1)
   * @returns {Promise<string>} - blob: URL ready for ThreeJS loader
   */
  async getOrDownload(url, name = "Unknown Asset", type = "character", onProgress = null) {
    const key = this._getKey(url)
    const metaKey = this._getMetaKey(url)
    
    // Improve generic names
    let finalName = name
    if (name === "Character" || name === "Animation" || name === "Unknown Asset") {
      finalName = url.split('/').pop().split('?')[0].replace(/\.[^/.]+$/, "")
      // format clean name
      finalName = finalName.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
    }

    try {
      // 1. Try cache
      const cachedBlob = await get(key)
      if (cachedBlob) {
        if (onProgress) onProgress(1)
        return URL.createObjectURL(cachedBlob)
      }

      // 2. Download
      if (onProgress) onProgress(0)
      
      const response = await fetch(url)
      if (!response.ok) throw new Error(`Failed to fetch asset: ${response.statusText}`)

      // Handle progress if contentLength is available
      const contentLength = response.headers.get('content-length')
      let blob
      
      if (contentLength && onProgress) {
        const total = parseInt(contentLength, 10)
        let loaded = 0
        const reader = response.body.getReader()
        const chunks = []

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          chunks.push(value)
          loaded += value.length
          onProgress(loaded / total)
        }
        blob = new Blob(chunks, { type: 'application/octet-stream' })
      } else {
        blob = await response.blob()
        if (onProgress) onProgress(1)
      }

      // 3. Store in IDB
      await set(key, blob)
      
      // Store metadata for the settings page
      await set(metaKey, {
        url,
        name: finalName,
        type,
        size: blob.size,
        cachedAt: Date.now()
      })

      return URL.createObjectURL(blob)

    } catch (err) {
      console.error("AssetCacheManager: Download failed", err)
      // Fallback: just return the URL and let ThreeJS load it directly
      return url
    }
  }
}

export default new AssetCacheManager()
