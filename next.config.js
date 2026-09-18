/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  // pdfkit reads its standard font files (Helvetica.afm etc.) off disk at
  // runtime using __dirname. If webpack bundles it into the route handler,
  // that path breaks and PDF generation crashes with
  // "ENOENT: ... Helvetica.afm", which is why the report-card PDF download
  // was failing. Keeping pdfkit external makes Next.js `require()` it
  // straight from node_modules instead, where its data files actually live.
  experimental: {
    serverComponentsExternalPackages: ["pdfkit"],
  },
};

module.exports = nextConfig;
