const API_KEY = import.meta.env.VITE_GIPHY_KEY

export const trendingGifs = async (offset = 0) => {
  const res = await fetch(
    `https://api.giphy.com/v1/gifs/trending?api_key=${API_KEY}&limit=20&offset=${offset}`
  )

  const data = await res.json()
  return data.data
}

export const searchGifs = async (query, offset = 0) => {
  const res = await fetch(
    `https://api.giphy.com/v1/gifs/search?api_key=${API_KEY}&q=${query}&limit=20&offset=${offset}`
  )

  const data = await res.json()
  return data.data
}