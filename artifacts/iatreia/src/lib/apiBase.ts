export function getApiBase(): string {
  return import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
}
