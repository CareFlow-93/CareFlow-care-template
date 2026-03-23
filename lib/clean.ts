export function cleanName(name?: string) {
  if (!name) return "";
  return name.replace(/^[!?]+/, "").trim();
}