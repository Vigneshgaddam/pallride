import { MetadataRoute } from "next";
import { db } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const database = await db.load();
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const urls: MetadataRoute.Sitemap = [
    { url: base + "/", lastModified: new Date() },
    { url: base + "/trips", lastModified: new Date() },
    { url: base + "/cars", lastModified: new Date() },
    { url: base + "/rentals", lastModified: new Date() },
    { url: base + "/buy", lastModified: new Date() },
    { url: base + "/sell", lastModified: new Date() },
    { url: base + "/safety", lastModified: new Date() },
  ];

  for (const t of database.trips.filter((x) => !x.hidden && x.status === "published")) {
    urls.push({
      url: base + (t.shareCode ? "/trips/" + t.shareCode : "/trips/" + t.id),
      lastModified: new Date(t.createdAt || Date.now()),
    });
  }
  for (const c of database.cars.filter((x) => x.status === "published")) {
    urls.push({ url: base + "/cars/" + c.id, lastModified: new Date(c.updatedAt || c.createdAt || Date.now()) });
  }
  for (const r of database.rentals.filter((x) => x.status === "available")) {
    urls.push({ url: base + "/rentals/" + r.id, lastModified: new Date(r.updatedAt || r.createdAt || Date.now()) });
  }

  return urls;
}