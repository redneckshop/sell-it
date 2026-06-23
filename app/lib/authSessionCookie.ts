export const SELL_IT_AUTH_COOKIE = "sell-it-authenticated";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function secureCookieSuffix() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.location.protocol === "https:" ? "; Secure" : "";
}

export function setSellItAuthCookie() {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${SELL_IT_AUTH_COOKIE}=true; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secureCookieSuffix()}`;
}

export function clearSellItAuthCookie() {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${SELL_IT_AUTH_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secureCookieSuffix()}`;
}
