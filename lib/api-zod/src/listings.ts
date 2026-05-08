import * as zod from "zod";

const LISTING_CATEGORIES = ["spaces", "equipment", "jobs", "supplies", "services"] as const;
const LISTING_STATUSES = ["published", "draft", "archived"] as const;

export const CreateListingBody = zod.object({
  category: zod.enum(LISTING_CATEGORIES),
  title: zod.string().min(3, "title must be at least 3 characters").max(200, "title must be 200 characters or fewer"),
  description: zod.string().max(10_000, "description must be 10,000 characters or fewer").nullish(),
  city: zod.string().nullish(),
  region: zod.string().nullish(),
  price: zod
    .union([zod.string(), zod.number()])
    .nullish()
    .transform((v) => {
      if (v === null || v === undefined || v === "") return null;
      const n = Number(v);
      if (!Number.isFinite(n) || n < 0) return undefined;
      return String(n);
    })
    .refine((v) => v !== undefined, { message: "price must be a non-negative number" }),
  price_unit: zod.string().nullish(),
  price_label: zod.string().nullish(),
  image_url: zod
    .string()
    .regex(/^https?:\/\/.+/, "image_url must be a valid http/https URL")
    .nullish(),
  contact_name: zod.string().nullish(),
  contact_email: zod
    .string()
    .email("contact_email is not a valid email address")
    .nullish(),
  contact_phone: zod.string().nullish(),
});

export type CreateListingBodyInput = zod.input<typeof CreateListingBody>;
export type CreateListingBodyOutput = zod.output<typeof CreateListingBody>;

const NULLABLE_OPTIONAL_FIELDS = [
  "description",
  "city",
  "region",
  "price",
  "price_unit",
  "price_label",
  "image_url",
  "contact_name",
  "contact_email",
  "contact_phone",
] as const;

export const UpdateListingBody = CreateListingBody.transform((data) => {
  const result = { ...data } as Record<string, unknown>;
  for (const field of NULLABLE_OPTIONAL_FIELDS) {
    if (result[field] === undefined) {
      result[field] = null;
    }
  }
  return result as typeof data & {
    [K in typeof NULLABLE_OPTIONAL_FIELDS[number]]: Exclude<(typeof data)[K], undefined>;
  };
});

export const AdminUpdateListingStatusBody = zod.object({
  status: zod.enum([...LISTING_STATUSES] as [string, ...string[]], {
    errorMap: () => ({ message: `status must be one of: ${LISTING_STATUSES.join(", ")}` }),
  }),
});
