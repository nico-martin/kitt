import {
  DEFAULT_SETTINGS,
  LOCAL_STORAGE_KEYS,
  SettingsFormValues,
} from "./constants.ts";

export const getSetting = (key: keyof SettingsFormValues): string =>
  window.localStorage.getItem(LOCAL_STORAGE_KEYS[key]) || DEFAULT_SETTINGS[key];

export default getSetting;
