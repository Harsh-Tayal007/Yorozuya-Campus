export const config = { runtime: "edge" }

const APPWRITE_ENDPOINT = "https://sfo.cloud.appwrite.io/v1"
const PROJECT_ID = "695ddb2e00385765c668"
const DATABASE_ID = "695e62c4000049ee04de"

async function fetchAll(collectionId, apiKey) {
  const url = `${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${collectionId}/documents?limit=100`
  const res = await fetch(url, {
    headers: {
      "X-Appwrite-Project": PROJECT_ID,
      "X-Appwrite-Key": apiKey,
    },
  })
  const data = await res.json()
  return data.documents || []
}

export default async function handler(req) {
  const apiKey = process.env.APPWRITE_API_KEY
  const today = new Date().toISOString().split("T")[0]

  const [universities, programs, branches] = await Promise.all([
    fetchAll("universities", apiKey),
    fetchAll("programs", apiKey),
    fetchAll("branches", apiKey),
  ])

  const staticUrls = [
    { loc: "/",             priority: "1.0", changefreq: "weekly" },
    { loc: "/forum",        priority: "0.9", changefreq: "daily"  },
    { loc: "/universities", priority: "0.8", changefreq: "weekly" },
    { loc: "/resources",    priority: "0.8", changefreq: "weekly" },
    { loc: "/updates",      priority: "0.7", changefreq: "weekly" },
    { loc: "/login",        priority: "0.3", changefreq: "yearly" },
    { loc: "/signup",       priority: "0.3", changefreq: "yearly" },
    { loc: "/privacy",      priority: "0.2", changefreq: "yearly" },
  ]

  const dynamicUrls = []

  for (const u of universities) {
    dynamicUrls.push({ loc: `/university/${u.$id}`, priority: "0.7" })
  }

  for (const p of programs) {
    dynamicUrls.push({ loc: `/programs/${p.$id}`,          priority: "0.7" })
    dynamicUrls.push({ loc: `/programs/${p.$id}/syllabus`, priority: "0.6" })
  }

  for (const b of branches) {
    const pid = b.programId
    const name = encodeURIComponent(b.name)
    dynamicUrls.push({ loc: `/programs/${pid}/branches/${name}`,           priority: "0.6" })
    dynamicUrls.push({ loc: `/programs/${pid}/branches/${name}/syllabus`,  priority: "0.5" })
    dynamicUrls.push({ loc: `/programs/${pid}/branches/${name}/resources`, priority: "0.5" })
    dynamicUrls.push({ loc: `/programs/${pid}/branches/${name}/pyqs`,      priority: "0.5" })
  }

  const allUrls = [...staticUrls, ...dynamicUrls]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url>
    <loc>https://unizuya.in${u.loc}</loc>
    <lastmod>${today}</lastmod>
    ${u.changefreq ? `<changefreq>${u.changefreq}</changefreq>` : ""}
    <priority>${u.priority}</priority>
  </url>`).join("\n")}
</urlset>`

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=86400",
    },
  })
}