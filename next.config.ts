import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const nextConfig: NextConfig = {
  // The demo database is read at request time by the pages that are not
  // prerendered, so it has to travel with the server bundle.
  outputFileTracingIncludes: { "/**": ["./src/seed/demo.sqlite"] },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return [
      // Kept from the PHP shop, where /about predated the CMS pages.
      {
        source: "/:locale(az|en|ru)/about",
        destination: "/:locale/pages/about-us",
        permanent: true,
      },
    ];
  },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
