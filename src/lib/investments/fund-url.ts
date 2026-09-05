export function normalizeSourceUrl(raw?: string): string {
  const value = (raw ?? "").trim();
  if (!value) {
    return "";
  }
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "";
    }
    parsed.hash = "";
    parsed.username = "";
    parsed.password = "";
    return parsed.toString();
  } catch {
    return "";
  }
}

export function isFundVehicle(type: string): type is "mutual_fund" | "etf" {
  return type === "mutual_fund" || type === "etf";
}
