import { X } from "lucide-react"
import { useRef, useState } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import useDebounce from "@/hooks/useDebounce"
import { searchGifs, trendingGifs } from "@/services/forum/giphy"

export default function GifPicker({ colors, gifSearch, setGifSearch, onClose, onSelectGif }) {

  const debouncedSearch = useDebounce(gifSearch, 400)

  const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
} = useInfiniteQuery({
    queryKey: ["gifs", debouncedSearch || "trending"],
    queryFn: ({ pageParam = 0 }) => {
      if (!debouncedSearch) {
        return trendingGifs(pageParam)
      }
      return searchGifs(debouncedSearch, pageParam)
    },
    getNextPageParam: (lastPage, pages) => {
      if (!lastPage.length) return undefined
      return pages.length * 20
    },
  })

  const gifs = data?.pages.flat() ?? []
  const gridRef = useRef(null)
  const [hoveredGif, setHoveredGif] = useState(null)

  return (
    <div style={{
      margin: "0 16px 8px",
      borderRadius: 12,
      border: `1px solid ${colors.border}`,
      padding: 12,
      flexShrink: 0,
      background: colors.card,
    }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: colors.muted }}>
          GIFs - GIPHY
        </span>

        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
          <X size={14} />
        </button>
      </div>

      <input
        value={gifSearch}
        onChange={(e) => setGifSearch(e.target.value)}
        placeholder="Search GIFs…"
        style={{
          width: "100%",
          borderRadius: 8,
          border: `1px solid ${colors.border}`,
          padding: "6px 10px",
          fontSize: 12
        }}
      />

      {/* GIF Grid */}

      {isLoading && (
        <div style={{ fontSize: 11, color: colors.muted }}>
          Loading GIFs...
        </div>
      )}

      <div
        ref={gridRef}
        onScroll={(e) => {
          const el = e.currentTarget

          if (
            el.scrollTop + el.clientHeight >= el.scrollHeight - 50 &&
            hasNextPage &&
            !isFetchingNextPage
          ) {
            fetchNextPage()
          }
        }}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(90px,1fr))",
          gap: 6,
          marginTop: 10,
          maxHeight: 260,
          overflowY: "auto",
        }}
      >
        {gifs.map((gif) => (
          <img
            key={gif.id}
            src={
              hoveredGif === gif.id
                ? gif.images.fixed_width_small.url
                : gif.images.fixed_width_small.webp
            }
            style={{
              width: "100%",
              height: 80,
              objectFit: "cover",
              borderRadius: 6,
              cursor: "pointer",
            }}
            onMouseEnter={() => setHoveredGif(gif.id)}
            onMouseLeave={() => setHoveredGif(null)}
            onClick={() => onSelectGif(gif.images.downsized.url)}
          />
        ))}
      </div>

      {isFetchingNextPage && (
        <div style={{ fontSize: 11, textAlign: "center" }}>
          Loading more...
        </div>
      )}

    </div>
  )
}