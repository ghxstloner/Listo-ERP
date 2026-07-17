const STORAGE_KEY = "listo-pos-device-key";

export function getPosDeviceKey() {
  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;
  const deviceKey = crypto.randomUUID();
  window.localStorage.setItem(STORAGE_KEY, deviceKey);
  return deviceKey;
}
