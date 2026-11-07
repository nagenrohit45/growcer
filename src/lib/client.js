export const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
export function readStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
export function saveStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Browsing remains available without storage. */
  }
}
export async function api(path, options = {}) {
  const response = await fetch("/api" + path, {
    credentials: "same-origin",
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
    ...(options.body !== undefined
      ? { body: JSON.stringify(options.body) }
      : {}),
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      "The store service returned an invalid response. Please try again.",
    );
  }
  if (!response.ok) {
    const error = new Error(
      data.error || "The request could not be completed.",
    );
    error.status = response.status;
    throw error;
  }
  return data;
}
