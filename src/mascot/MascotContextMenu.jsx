import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery } from "@tanstack/react-query"
import { databases, Query } from "@/lib/appwrite"
import { DATABASE_ID, MASCOT_ASSETS_COLLECTION_ID } from "@/config/appwrite"
import { X, Volume2, VolumeX, Maximize, FileBox, User, Download, Check, Settings } from "lucide-react"
import { toast } from "sonner"
import AssetCacheManager from "./AssetCacheManager"

// Estimated max menu dimensions — used for viewport clamping in UIController.openContextMenu
const MENU_W = 256
const MENU_MAX_H = 380

export default function MascotContextMenu({ uiState, uiController, adminDefaults }) {
  const [activeTab, setActiveTab] = useState("main")
  const menuRef = useRef(null)
  const [cachedAssets, setCachedAssets] = useState(new Map())
  const [remoteSizes, setRemoteSizes] = useState(new Map())
  const [downloadingUrls, setDownloadingUrls] = useState(new Set())

  const loadCache = async () => {
    const assets = await AssetCacheManager.getCachedAssets()
    const map = new Map()
    for (const a of assets) map.set(a.url, a.size)
    setCachedAssets(map)
  }

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  useEffect(() => {
    loadCache()
  }, [])

  // Fetch assets from Appwrite
  const { data: assets } = useQuery({
    queryKey: ["mascot-assets"],
    queryFn: async () => {
      try {
        const res = await databases.listDocuments(DATABASE_ID, MASCOT_ASSETS_COLLECTION_ID, [Query.limit(100)])
        return res.documents
      } catch (err) {
        console.error("Failed to fetch mascot assets:", err)
        return []
      }
    },
    staleTime: 0,
  })

  const characters = assets?.filter((a) => a.type === "character") ?? []
  const allAnimations = assets?.filter((a) => a.type === "animation") ?? []

  // Auto-hide any animation that is currently assigned to an interaction zone
  const currentAsset = assets?.find(a => a.fileUrl === uiState.character)
  
  let configStr = currentAsset?.interaction_config || adminDefaults?.interaction_config || "{}"
  let parsedConfig = {}
  try {
    parsedConfig = JSON.parse(configStr)
  } catch (e) {}

  const interactionUrls = new Set([
    ...Object.values(parsedConfig).map(v => v.animation),
    ...["interaction_head", "interaction_chest", "interaction_belly", "interaction_crotch", "interaction_legs", "interaction_hide"]
      .map(k => adminDefaults?.[k])
  ].filter(Boolean))

  const animations = allAnimations.filter(a => !interactionUrls.has(a.fileUrl))

  // Fetch remote sizes for assets that aren't cached
  useEffect(() => {
    if (!assets || assets.length === 0) return
    const fetchSizes = async () => {
      let updated = false
      const newSizes = new Map(remoteSizes)
      
      const promises = assets.map(async (asset) => {
        if (cachedAssets.has(asset.fileUrl) || newSizes.has(asset.fileUrl)) return
        try {
          const controller = new AbortController()
          const res = await fetch(asset.fileUrl, { signal: controller.signal })
          const len = res.headers.get("content-length")
          if (len && parseInt(len, 10) > 1000) {
            newSizes.set(asset.fileUrl, parseInt(len, 10))
            updated = true
          }
          controller.abort()
        } catch (e) {
          // ignore network errors
        }
      })
      
      await Promise.all(promises)
      if (updated) setRemoteSizes(new Map(newSizes))
    }
    fetchSizes()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets, cachedAssets])

  const handleItemClick = async (asset, type) => {
    const isCached = cachedAssets.has(asset.fileUrl)
    
    if (!isCached) {
      setDownloadingUrls(prev => new Set([...prev, asset.fileUrl]))
      toast.info(`Downloading ${type}...`)
      
      await AssetCacheManager.getOrDownload(asset.fileUrl, asset.name, type)
      
      setDownloadingUrls(prev => {
        const next = new Set(prev)
        next.delete(asset.fileUrl)
        return next
      })
      await loadCache()
    }

    if (type === "character") {
      uiController.setCharacter(asset.fileUrl)
    } else {
      window.dispatchEvent(
        new CustomEvent("mascot-play-vrma", { detail: { url: asset.fileUrl } })
      )
    }
  }

  // Close on Escape
  useEffect(() => {
    if (!uiState.contextMenuOpen) return
    const onKey = (e) => {
      if (e.key === "Escape") uiController.closeContextMenu()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [uiState.contextMenuOpen, uiController])

  // Reset to main tab when menu re-opens
  useEffect(() => {
    if (uiState.contextMenuOpen) {
      setActiveTab("main")
      loadCache() // refresh cache status on open
    }
  }, [uiState.contextMenuOpen])

  const handleSfxToggle = () => {
    uiController.setSfxEnabled(!uiState.sfxEnabled)
  }

  const handleVolumeChange = (e) => {
    const uiVal = parseFloat(e.target.value)
    uiController.setSfxVolume(uiVal / 100)
  }

  const handleWheelOnVolume = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const step = 0.05
    const delta = e.deltaY > 0 ? -step : step
    const newVal = Math.min(Math.max((uiState.sfxVolume ?? 1.0) + delta, 0), 1)
    uiController.setSfxVolume(newVal)
  }

  const handleScaleChange = (e) => {
    const uiVal = parseFloat(e.target.value)
    // Map 0-100 back to 0.5-1.6
    const internalScale = 0.5 + (uiVal / 100) * 1.1
    uiController.setMascotScale(internalScale)
  }

  const handleWheelOnSlider = (e) => {
    // Stop wheel events on the slider from reaching the canvas
    e.preventDefault()
    e.stopPropagation()
    const step = 0.011 // 1% of the 1.1 total range
    const delta = e.deltaY > 0 ? -step : step
    const newVal = Math.min(
      Math.max((uiState.mascotScale || 1.0) + delta, 0.5),
      1.6,
    )
    uiController.setMascotScale(newVal)
  }

  if (!uiState.contextMenuOpen) return null

  // Position is already viewport-clamped by UIController.openContextMenu
  const { x, y } = uiState.contextMenuPosition

  return (
    <div
      className="fixed inset-0 z-[100] pointer-events-auto"
      onClick={() => uiController.closeContextMenu()}
      onContextMenu={(e) => {
        e.preventDefault()
        uiController.closeContextMenu()
      }}
    >
      <AnimatePresence>
        <motion.div
          ref={menuRef}
          key="mascot-context-menu"
          initial={{ opacity: 0, scale: 0.94, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: -4 }}
          transition={{ duration: 0.13, ease: "easeOut" }}
          data-mascot-ignore-interaction="true"
          className="absolute bg-card/85 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          style={{
            left: x,
            top: y,
            width: MENU_W,
            maxHeight: MENU_MAX_H,
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerMove={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          // Prevent wheel inside menu from reaching the canvas
          onWheel={(e) => { e.stopPropagation() }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/40 bg-foreground/5 shrink-0">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {activeTab === "main"
                ? "Mascot Settings"
                : activeTab === "characters"
                ? "Characters"
                : "Poses"}
            </span>
            <button
              onClick={() => uiController.closeContextMenu()}
              className="p-1 rounded-md hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close menu"
            >
              <X size={13} />
            </button>
          </div>

          {/* Content — scrollable */}
          <div className="p-2 flex flex-col gap-1 overflow-y-auto overflow-x-hidden flex-1 custom-scrollbar">
            {/* ── Main tab ── */}
            {activeTab === "main" && (
              <>
                {/* Size slider */}
                <div className="p-2.5 rounded-lg hover:bg-muted/30 transition-colors flex flex-col gap-2">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span className="flex items-center gap-2">
                      <Maximize size={14} className="text-muted-foreground" />
                      Size
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {Math.round(((uiState.mascotScale - 0.5) / 1.1) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={Math.round(((uiState.mascotScale - 0.5) / 1.1) * 100)}
                    onChange={handleScaleChange}
                    onWheel={handleWheelOnSlider}
                    className="w-full accent-primary"
                  />
                </div>

                {/* Sound */}
                <div className="p-2.5 rounded-lg hover:bg-muted/30 transition-colors flex flex-col gap-2">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <button
                      onClick={handleSfxToggle}
                      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                      {uiState.sfxEnabled ? (
                        <Volume2 size={14} className="text-primary" />
                      ) : (
                        <VolumeX size={14} className="text-muted-foreground" />
                      )}
                      Sound Effects
                    </button>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {Math.round((uiState.sfxVolume ?? 1.0) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={Math.round((uiState.sfxVolume ?? 1.0) * 100)}
                    onChange={handleVolumeChange}
                    onWheel={handleWheelOnVolume}
                    className="w-full accent-primary"
                    disabled={!uiState.sfxEnabled}
                    style={{ opacity: uiState.sfxEnabled ? 1 : 0.5 }}
                  />
                </div>

                <div className="h-px bg-border/40 my-0.5" />

                {/* Characters nav */}
                <button
                  onClick={() => setActiveTab("characters")}
                  className="p-2.5 rounded-lg hover:bg-muted/30 transition-colors flex items-center justify-between text-sm font-medium text-left"
                >
                  <span className="flex items-center gap-2">
                    <User size={14} className="text-muted-foreground" />
                    Change Character
                  </span>
                  <span className="text-xs text-muted-foreground">{characters.length}</span>
                </button>

                {/* Animations nav */}
                <button
                  onClick={() => setActiveTab("animations")}
                  className="p-2.5 rounded-lg hover:bg-muted/30 transition-colors flex items-center justify-between text-sm font-medium text-left"
                >
                  <span className="flex items-center gap-2">
                    <FileBox size={14} className="text-muted-foreground" />
                    Play Pose
                  </span>
                  <span className="text-xs text-muted-foreground">{animations.length}</span>
                </button>
              </>
            )}

            {/* ── Characters tab ── */}
            {activeTab === "characters" && (
              <>
                <button
                  onClick={() => setActiveTab("main")}
                  className="p-1.5 text-xs font-medium text-muted-foreground hover:text-foreground text-left flex items-center gap-1 shrink-0"
                >
                  ← Back
                </button>
                <div className="space-y-1">
                  {characters.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2 text-center">
                      No characters uploaded yet.
                    </p>
                  ) : (
                    characters.map((char) => {
                      const cachedSize = cachedAssets.get(char.fileUrl)
                      const remoteSize = remoteSizes.get(char.fileUrl)
                      const finalSize = cachedSize || remoteSize
                      const isCached = cachedSize !== undefined
                      const isDownloading = downloadingUrls.has(char.fileUrl)
                      
                      return (
                        <button
                          key={char.$id}
                          disabled={isDownloading}
                          onClick={() => handleItemClick(char, "character")}
                          className={`w-full p-2 text-sm text-left rounded-lg transition-colors flex items-center justify-between group ${
                            uiState.character === char.fileUrl
                              ? "bg-primary/15 text-primary font-semibold"
                              : "hover:bg-muted/50"
                          } ${isDownloading ? "opacity-70 cursor-wait" : ""}`}
                        >
                          <span className="truncate mr-2">{char.name}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {finalSize && (
                              <span className="text-[9px] font-mono opacity-50 bg-background/50 group-hover:bg-background px-1 py-0.5 rounded transition-colors">
                                {formatBytes(finalSize)}
                              </span>
                            )}
                            {isDownloading ? (
                              <div className="animate-spin text-primary">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                              </div>
                            ) : isCached ? (
                              <Check size={12} className="text-green-500" />
                            ) : (
                              <Download size={12} className="text-muted-foreground" />
                            )}
                          </div>
                        </button>
                      )
                    })
                  )}
                  <div className="mt-2 p-2 rounded-lg bg-muted/30 border border-border/50 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-medium text-foreground mb-1"><Settings size={12} /> Manage Downloads</span>
                    Head over to Dashboard Settings &gt; Mascot to clear storage or view cache sizes.
                  </div>
                </div>
              </>
            )}

            {/* ── Animations tab ── */}
            {activeTab === "animations" && (
              <>
                <button
                  onClick={() => setActiveTab("main")}
                  className="p-1.5 text-xs font-medium text-muted-foreground hover:text-foreground text-left flex items-center gap-1 shrink-0"
                >
                  ← Back
                </button>
                <div className="space-y-1">
                  {animations.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2 text-center">
                      No animations uploaded yet.
                    </p>
                  ) : (
                    animations.map((anim) => {
                      const cachedSize = cachedAssets.get(anim.fileUrl)
                      const remoteSize = remoteSizes.get(anim.fileUrl)
                      const finalSize = cachedSize || remoteSize
                      const isCached = cachedSize !== undefined
                      const isDownloading = downloadingUrls.has(anim.fileUrl)
                      
                      return (
                        <button
                          key={anim.$id}
                          disabled={isDownloading}
                          onClick={() => handleItemClick(anim, "animation")}
                          className={`w-full p-2 text-sm text-left rounded-lg hover:bg-muted/50 transition-colors flex items-center justify-between group ${
                            isDownloading ? "opacity-70 cursor-wait" : ""
                          }`}
                        >
                          <span className="truncate mr-2">{anim.name}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {finalSize && (
                              <span className="text-[9px] font-mono opacity-50 bg-background/50 group-hover:bg-background px-1 py-0.5 rounded transition-colors">
                                {formatBytes(finalSize)}
                              </span>
                            )}
                            {isDownloading ? (
                              <div className="animate-spin text-primary">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                              </div>
                            ) : isCached ? (
                              <Check size={12} className="text-green-500" />
                            ) : (
                              <Download size={12} className="text-muted-foreground" />
                            )}
                          </div>
                        </button>
                      )
                    })
                  )}
                  <div className="mt-2 p-2 rounded-lg bg-muted/30 border border-border/50 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-medium text-foreground mb-1"><Settings size={12} /> Setup Loop Sequence</span>
                    Want to play multiple animations in order? Configure your loop sequence in Dashboard Settings &gt; Mascot.
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}