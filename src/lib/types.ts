export type Locale = "az" | "en" | "ru";

export type Color = {
  slug: string;
  name: string;
  hex: string;
};

export type SizeStock = Record<string, { available: boolean; remaining: number | null }>;

export type Product = {
  slug: string;
  name: string;
  series: string;
  item: string;
  type: "single" | "set";
  category: string;
  category_slug: string;
  fabric: string;
  price: number;
  compare_at: number | null;
  color: Color;
  sizes: string[];
  size_stock: SizeStock;
  in_stock: boolean;
  is_preorder: boolean;
  preorder_ships_at: string | null;
  is_new: boolean;
  composition: string;
  set_parts: string[] | null;
  description: string;
  features: string[];
  images: string[];
};

export type ProductSibling = Pick<Product, "slug" | "color" | "in_stock">;

export type Category = {
  slug: string;
  name: string | null;
  labelKey: string | null;
  parent: string | null;
  description?: string | null;
};

export type Slide = {
  title: string;
  subtitle: string;
  cta: string;
  url: string;
  image: string;
  imageMobile: string | null;
};

export type ColorTile = Color & { url: string; image: string };

export type FeaturedBlock = {
  title: string;
  url: string;
  products: Product[];
};

export type NavItem = {
  label?: string;
  labelKey?: string;
  url: string;
  children?: NavItem[];
};

export type FooterGroup = {
  title?: string;
  titleKey?: string;
  links: NavItem[];
};

export type ShopSettings = {
  name: string;
  currency: { code: string; symbol: string };
  freeShippingThreshold: number;
  shippingFee: number;
  navigation: NavItem[];
  footer: FooterGroup[];
};

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  cover: string | null;
  url: string;
  publishedAt: string;
  publishedAtIso: string;
  images: string[];
  body?: string;
  lexical?: unknown;
};

export type StaticPage = {
  title: string;
  body: string;
  lexical?: unknown;
};

export type ContactDetails = {
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  workingHours: string | null;
  socials: { name: string; handle: string }[];
};

export type Facets = {
  categories: string[];
  fabrics: string[];
  colors: Color[];
  sizes: string[];
  priceMax: number;
};

export type SortKey = "featured" | "newest" | "price-asc" | "price-desc" | "name-asc" | "name-desc";

export type CollectionFilters = {
  category?: string[];
  color?: string[];
  size?: string[];
  fabric?: string[];
  maxPrice?: number;
  inStockOnly?: boolean;
  sort?: SortKey;
  page?: number;
};
