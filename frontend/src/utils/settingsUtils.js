import { settingsAPI } from '../api/api';

export const DEFAULT_DELIVERY_SETTINGS = {
  freeDeliveryThreshold: 299,
  standardDeliveryCharge: 35,
  deliveryTimeText: "15-30 Mins",
  isFreeDeliveryEnabled: true
};

const STORAGE_KEY = 'freshcart_delivery_settings';

/**
 * Returns current delivery settings synchronously from localStorage cache
 * with zero flicker, falling back to defaults.
 */
export const getDeliverySettings = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_DELIVERY_SETTINGS,
        ...parsed,
        freeDeliveryThreshold: Number(parsed.freeDeliveryThreshold ?? DEFAULT_DELIVERY_SETTINGS.freeDeliveryThreshold),
        standardDeliveryCharge: Number(parsed.standardDeliveryCharge ?? DEFAULT_DELIVERY_SETTINGS.standardDeliveryCharge)
      };
    }
  } catch (err) {
    console.warn("Failed reading cached delivery settings:", err);
  }
  return DEFAULT_DELIVERY_SETTINGS;
};

/**
 * Fetches latest settings from backend API and updates local cache
 */
export const syncDeliverySettings = async () => {
  try {
    const res = await settingsAPI.get();
    if (res.data?.success && res.data.settings) {
      const serverSettings = {
        freeDeliveryThreshold: Number(res.data.settings.freeDeliveryThreshold ?? DEFAULT_DELIVERY_SETTINGS.freeDeliveryThreshold),
        standardDeliveryCharge: Number(res.data.settings.standardDeliveryCharge ?? DEFAULT_DELIVERY_SETTINGS.standardDeliveryCharge),
        deliveryTimeText: res.data.settings.deliveryTimeText || DEFAULT_DELIVERY_SETTINGS.deliveryTimeText,
        isFreeDeliveryEnabled: Boolean(res.data.settings.isFreeDeliveryEnabled ?? true)
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serverSettings));
      window.dispatchEvent(new CustomEvent('freshcart_settings_updated', { detail: serverSettings }));
      return serverSettings;
    }
  } catch (err) {
    // Graceful offline fallback
    console.debug("Backend settings sync not reachable, using local cached settings.");
  }
  return getDeliverySettings();
};

/**
 * Updates delivery settings via API and local storage, notifying all components
 */
export const saveDeliverySettings = async (updatedSettings) => {
  const merged = {
    ...getDeliverySettings(),
    ...updatedSettings,
    freeDeliveryThreshold: Number(updatedSettings.freeDeliveryThreshold),
    standardDeliveryCharge: Number(updatedSettings.standardDeliveryCharge),
    isFreeDeliveryEnabled: Boolean(updatedSettings.isFreeDeliveryEnabled)
  };

  // 1. Save to local storage first for instant feedback
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  window.dispatchEvent(new CustomEvent('freshcart_settings_updated', { detail: merged }));

  // 2. Persist to backend database
  try {
    await settingsAPI.update(merged);
  } catch (err) {
    console.warn("Backend update error (cached locally):", err);
  }

  return merged;
};
