import {
  LOCAL_STORAGE_KEYS,
  SettingsFormValues,
} from "@utils/settings/constants.ts";

export const setSetting = (key: keyof SettingsFormValues, value: string) =>
  window.localStorage.setItem(LOCAL_STORAGE_KEYS[key], value);

export default setSetting;
