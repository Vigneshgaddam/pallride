import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/trips", "/trips/*", "/cars", "/cars/*", "/rentals", "/rentals/*", "/buy", "/sell", "/safety", "/reports"],
        disallow: ["/admin", "/admin/*", "/dashboard", "/account", "/driver", "/api/*"],
      },
    ],
    sitemap: "/sitemap.xml",
  };
}