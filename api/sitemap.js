export const config = { runtime: "edge" }

const APPWRITE_ENDPOINT = "https://sfo.cloud.appwrite.io/v1"
const PROJECT_ID = "695ddb2e00385765c668"
const DATABASE_ID = "695e62c4000049ee04de"

async function fetchAll(collectionId) {
  const url = `${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${collectionId}/documents?limit=100`

  const res = await fetch(url, {
    headers: {
      "X-Appwrite-Project": PROJECT_ID,
      "X-Appwrite-Key": process.env.APPWRITE_API_KEY, // ✅ correct for Vercel
    },
  })

  const data = await res.json()
  return data.documents || []
}

export default async function handler() {
  const today = new Date().toISOString().split("T")[0]

  const [universities, programs, branches] = await Promise.all([
    fetchAll("universities"),
    fetchAll("programs"),
    fetchAll("branches"),
  ])

  const staticUrls = [
    { loc: "/", priority: "1.0", changefreq: "weekly" },
    { loc: "/about", priority: "0.8", changefreq: "monthly" },
    { loc: "/contact", priority: "0.7", changefreq: "monthly" },
    { loc: "/forum", priority: "0.9", changefreq: "daily" },
    { loc: "/universities", priority: "0.8", changefreq: "weekly" },
    { loc: "/resources", priority: "0.8", changefreq: "weekly" },
    { loc: "/updates", priority: "0.7", changefreq: "weekly" },
    { loc: "/privacy", priority: "0.3", changefreq: "yearly" },
  ]

  const dynamicUrls = []

  for (const u of universities) {
    dynamicUrls.push({
      loc: `/university/${u.$id}`,
      priority: "0.7",
      lastmod: u.$updatedAt || today,
    })
  }

  for (const p of programs) {
    dynamicUrls.push({
      loc: `/programs/${p.$id}`,
      priority: "0.7",
      lastmod: p.$updatedAt || today,
    })

    dynamicUrls.push({
      loc: `/programs/${p.$id}/syllabus`,
      priority: "0.6",
      lastmod: p.$updatedAt || today,
    })
  }

  for (const b of branches) {
    const pid = b.programId
    const name = encodeURIComponent(b.name)

    dynamicUrls.push({
      loc: `/programs/${pid}/branches/${name}`,
      priority: "0.6",
      lastmod: b.$updatedAt || today,
    })

    dynamicUrls.push({
      loc: `/programs/${pid}/branches/${name}/syllabus`,
      priority: "0.5",
      lastmod: b.$updatedAt || today,
    })

    dynamicUrls.push({
      loc: `/programs/${pid}/branches/${name}/resources`,
      priority: "0.5",
      lastmod: b.$updatedAt || today,
    })

    dynamicUrls.push({
      loc: `/programs/${pid}/branches/${name}/pyqs`,
      priority: "0.5",
      lastmod: b.$updatedAt || today,
    })
  }

  const allUrls = [...staticUrls, ...dynamicUrls]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url>
    <loc>https://unizuya.in${u.loc}</loc>
    <lastmod>${(u.lastmod || today).split("T")[0]}</lastmod>
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