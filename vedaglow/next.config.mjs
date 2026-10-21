/** Security headers for every page. (A strict Content-Security-Policy is intentionally NOT set yet: it needs testing with the payment provider's scripts.) */
const security = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: security },
      { source: "/admin/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
};
export default nextConfig;
