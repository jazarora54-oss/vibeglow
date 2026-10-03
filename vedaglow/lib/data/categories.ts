import type { Category } from "@/types";
// Swap this for a Supabase query in Step 3: supabase.from("categories").select("*")
const categories: Category[] = [
  { id: "c1", slug: "skin-care", name: "Skin Care", href: "/category/skin-care", tone: "#F3DCCB" },
  { id: "c2", slug: "hair-care", name: "Hair Care", href: "/category/hair-care", tone: "#E9D2B4" },
  { id: "c3", slug: "body-care", name: "Body Care", href: "/category/body-care", tone: "#F1E3B8" },
  { id: "c4", slug: "health-wellness", name: "Health & Wellness", href: "/category/health-wellness", tone: "#D9E6D2" },
  { id: "c5", slug: "oral-care", name: "Oral Care", href: "/category/oral-care", tone: "#D6E6EE" },
  { id: "c6", slug: "new-arrivals", name: "New Arrivals", href: "/new-arrivals", tone: "#DDE8CF" },
  { id: "c7", slug: "sale", name: "Sale", href: "/sale", tone: "#F4D2CC" },
];
export async function getCategories(): Promise<Category[]> { return categories; }
