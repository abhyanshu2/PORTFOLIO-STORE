export type FieldType = "text" | "textarea" | "number" | "url" | "select" | "array" | "image" | "video" | "image-array";

export interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  required?: boolean;
  placeholder?: string;
}

export interface TableConfig {
  table: string;
  title: string;
  singular: string;
  primaryKey: string;
  orderBy?: string;
  fields: FieldConfig[];
  listColumns: string[];
  noAddDelete?: boolean; // fixed set of rows — edit only, no add/delete UI
}

export const TEMPLATES_CONFIG: TableConfig = {
  table: "templates",
  title: "Templates",
  singular: "Template",
  primaryKey: "id",
  orderBy: "sort_order",
  fields: [
    { key: "id", label: "ID (slug)", type: "text", required: true, placeholder: "e.g. birthday-scrapbook" },
    { key: "name", label: "Name", type: "text", required: true },
    { key: "monogram", label: "Monogram", type: "text", required: true, placeholder: "e.g. BS" },
    {
      key: "category",
      label: "Category",
      type: "select",
      required: true,
      options: ["birthday", "proposal", "wedding", "sorry"],
    },
    { key: "description", label: "Description", type: "textarea", required: true },
    { key: "features", label: "Features (comma separated)", type: "array" },
    { key: "price", label: "Price (₹)", type: "number", required: true },
    { key: "badge", label: "Badge", type: "select", options: ["", "trending", "new", "bestseller", "premium"] },
    { key: "screenshots", label: "Screenshots (comma separated)", type: "array" },
    { key: "cover_image_url", label: "Cover Image (shown on the card)", type: "image" },
    { key: "gallery_image_urls", label: "Gallery Images", type: "image-array" },
    { key: "video_url", label: "Demo Video", type: "video" },
    { key: "sort_order", label: "Sort Order", type: "number" },
  ],
  listColumns: ["name", "category", "price", "badge"],
};

export const MY_PRODUCTS_CONFIG: TableConfig = {
  table: "my_products",
  title: "My Products",
  singular: "Product",
  primaryKey: "id",
  orderBy: "sort_order",
  fields: [
    { key: "id", label: "ID (slug)", type: "text", required: true, placeholder: "e.g. notiq" },
    { key: "name", label: "Name", type: "text", required: true },
    { key: "monogram", label: "Monogram", type: "text", required: true },
    { key: "description", label: "Description", type: "textarea", required: true },
    { key: "features", label: "Features (comma separated)", type: "array" },
    { key: "stack", label: "Tech stack (comma separated)", type: "array" },
    { key: "status", label: "Status", type: "select", options: ["live", "coming-soon"] },
    { key: "live_url", label: "Live URL", type: "url" },
    { key: "learn_more_url", label: "Learn More URL", type: "url" },
    { key: "sort_order", label: "Sort Order", type: "number" },
  ],
  listColumns: ["name", "status", "stack"],
};

export const RESOURCES_CONFIG: TableConfig = {
  table: "resources",
  title: "Resources",
  singular: "Resource",
  primaryKey: "id",
  orderBy: "sort_order",
  fields: [
    { key: "id", label: "ID (slug)", type: "text", required: true, placeholder: "e.g. html-notes" },
    { key: "name", label: "Name", type: "text", required: true },
    { key: "description", label: "Description", type: "textarea", required: true },
    { key: "url", label: "Download URL", type: "url", required: true },
    { key: "type", label: "Type", type: "text", placeholder: "PDF" },
    { key: "sort_order", label: "Sort Order", type: "number" },
  ],
  listColumns: ["name", "type", "url"],
};

export const SERVICES_CONFIG: TableConfig = {
  table: "services",
  title: "Services",
  singular: "Service",
  primaryKey: "id",
  orderBy: "sort_order",
  fields: [
    { key: "id", label: "ID (slug)", type: "text", required: true, placeholder: "e.g. portfolio-dev" },
    { key: "name", label: "Name", type: "text", required: true },
    { key: "description", label: "Description", type: "textarea", required: true },
    { key: "price", label: "Price label", type: "text", placeholder: "from ₹4,999" },
    { key: "features", label: "Features (comma separated)", type: "array" },
    { key: "sort_order", label: "Sort Order", type: "number" },
  ],
  listColumns: ["name", "price"],
};

export const PORTFOLIO_PROJECTS_CONFIG: TableConfig = {
  table: "portfolio_projects",
  title: "Portfolio Projects",
  singular: "Project",
  primaryKey: "id",
  orderBy: "sort_order",
  noAddDelete: true,
  fields: [
    { key: "name", label: "Name", type: "text", required: true },
    { key: "description", label: "Description", type: "textarea", required: true },
    { key: "tech", label: "Tech stack (comma separated)", type: "array" },
    { key: "github_url", label: "GitHub URL", type: "url" },
    { key: "live_url", label: "Live Preview URL", type: "url" },
    { key: "year", label: "Year", type: "text" },
  ],
  listColumns: ["name", "year"],
};