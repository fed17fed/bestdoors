import type { CategoryType } from "@bestdoors/shared";

export type Category = {
  id: string;
  slug: string;
  type: CategoryType;
  imageUrl: string;
  parentId: string | null;
  name: string;
  description: string;
  productCount: number;
};

export type ProductImage = { id?: string; url: string; alt: string };

export type ProductCard = {
  id: string;
  slug: string;
  name: string;
  description: string;
  material: string;
  price: number;
  featured: boolean;
  image: ProductImage | null;
  category: { slug: string; type: CategoryType; name: string };
};

export type OptionValue = {
  id: string;
  code: string;
  label: string;
  priceDelta: number;
  swatch: string;
  isDefault: boolean;
};

export type OptionGroup = { id: string; code: string; name: string; values: OptionValue[] };

export type ProductDetail = ProductCard & { images: ProductImage[]; optionGroups: OptionGroup[] };

export type ProductList = {
  data: ProductCard[];
  total: number;
  page: number;
  perPage: number;
  facets: { materials: string[] };
};

/** Info page in the list (footer, sitemap). */
export type InfoPageSummary = { slug: string; title: string; showInFooter: boolean; sortOrder: number; updatedAt: string };

/** Info page from the CMS. `content` is HTML that the API has already cleaned. */
export type InfoPage = InfoPageSummary & { content: string; seoTitle: string; seoDescription: string };
