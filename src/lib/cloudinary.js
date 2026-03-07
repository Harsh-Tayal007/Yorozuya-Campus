export function optimizeImage(url) {
  if (!url) return url

  return url.replace(
    "/upload/",
    "/upload/f_auto,q_auto/"
  )
}