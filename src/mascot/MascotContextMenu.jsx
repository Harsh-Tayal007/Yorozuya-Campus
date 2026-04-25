import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery } from "@tanstack/react-query"
import { databases } from "@/lib/appwrite"
import { DATABASE_ID, MASCOT_ASSETS_COLLECTION_ID } from "@/config/appwrite"
import { X, Volume2, VolumeX, Maximize, FileBox, User } from "lucide-react"
import { toast } from "sonner"

// Estimated max menu dimensions — used for viewport clamping in UIController.openContextMenu
const MENU_W = 256
const MENU_MAX_H = 380

export default function MascotContextMenu({ uiState, uiController }) {
  const [activeTab, setActiveTab] = useState("main")
  const menuRef = useRef(null)

  // Fetch assets from Appwrite
  const { data: assets } = useQuery({
    queryKey: ["mascot-assets"],
    queryFn: async () => {
      try {
        const res = await databases.listDocuments(DATABASE_ID, MASCOT_ASSETS_COLLECTION_ID)
        return res.documents
      } catch (err) {
        console.error("Failed to fetch mascot assets:", err)
        return []
      }
    },
    staleTime: 1000 * 60 * 10,
  })

  const characters = assets?.filter((a) => a.type === "character") ?? []
  const animations = assets?.filter((a) => a.type === "animation") ?? []

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
    if (uiState.contextMenuOpen) setActiveTab("main")
  }, [uiState.contextMenuOpen])

  const handleSfxToggle = () => {
    toast("Sound integration coming soon!", {
      description: "Interactive voice and SFX are still in development.",
      icon: <VolumeX className="text-muted-foreground w-4 h-4" />,
    })
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
                <button
                  onClick={handleSfxToggle}
                  className="p-2.5 rounded-lg hover:bg-muted/30 transition-colors flex items-center justify-between text-sm font-medium text-left"
                >
                  <span className="flex items-center gap-2">
                    {uiState.sfxEnabled ? (
                      <Volume2 size={14} className="text-primary" />
                    ) : (
                      <VolumeX size={14} className="text-muted-foreground" />
                    )}
                    Sound Effects
                  </span>
                  <span className="text-[10px] uppercase tracking-wide bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                    Soon
                  </span>
                </button>

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
                    characters.map((char) => (
                      <button
                        key={char.$id}
                        onClick={() => {
                          uiController.setCharacter(char.fileUrl)
                          uiController.closeContextMenu()
                        }}
                        className={`w-full p-2 text-sm text-left rounded-lg transition-colors ${
                          uiState.character === char.fileUrl
                            ? "bg-primary/15 text-primary font-semibold"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        {char.name}
                      </button>
                    ))
                  )}
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
                    animations.map((anim) => (
                      <button
                        key={anim.$id}
                        onClick={() => {
                          window.dispatchEvent(
                            new CustomEvent("mascot-play-vrma", {
                              detail: { url: anim.fileUrl },
                            }),
                          )
                          uiController.closeContextMenu()
                        }}
                        className="w-full p-2 text-sm text-left rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        {anim.name}
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}