export const THERAPIST_COUNTRIES = [
  ["PK", "Pakistan"], ["AE", "United Arab Emirates"], ["SA", "Saudi Arabia"],
  ["GB", "United Kingdom"], ["US", "United States"], ["CA", "Canada"],
  ["AU", "Australia"], ["QA", "Qatar"], ["OM", "Oman"], ["TR", "Türkiye"],
  ["BD", "Bangladesh"], ["IN", "India"],
] as const;

export function countryFlag(code?: string) {
  const normalized = (code ?? "PK").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) return "🌍";
  return String.fromCodePoint(...[...normalized].map((letter) => 127397 + letter.charCodeAt(0)));
}

export function countryName(code?: string) {
  const normalized = (code ?? "PK").trim().toUpperCase();
  return THERAPIST_COUNTRIES.find(([countryCode]) => countryCode === normalized)?.[1] ?? "International";
}
