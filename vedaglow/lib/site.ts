/** Public address of the store (used for SEO: sitemap, canonical links, social previews). Set NEXT_PUBLIC_SITE_URL to your final domain. */
export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || process.env.URL || "https://vedaglow.netlify.app").replace(/\/$/, "");
