export interface SettingsFormValues {
  llmProvider: string;
  geminiApiKey: string;
  speechToTextLanguage: string;
  audioInputDeviceId: string;
}

export enum LlmProvider {
  GEMMA2_2B = "gemma2_2b",
  GEMMA2_9B = "gemma2_9b",
  GEMINI = "gemini",
}

export const LLM_NAMES: Record<LlmProvider, string> = {
  [LlmProvider.GEMMA2_2B]: "Gemma2 2b (local)",
  [LlmProvider.GEMMA2_9B]: "Gemma2 9b (local)",
  [LlmProvider.GEMINI]: "Gemini (cloud)",
};

export const DEFAULT_SETTINGS: Record<keyof SettingsFormValues, string> = {
  geminiApiKey: "",
  llmProvider: LlmProvider.GEMMA2_2B,
  speechToTextLanguage: "en",
  audioInputDeviceId: "",
};

export const LOCAL_STORAGE_KEYS: Record<keyof SettingsFormValues, string> = {
  geminiApiKey: "GOOGLE_AI_STUDIO_API_KEY",
  llmProvider: "KITT_LLM_PROVIDER",
  speechToTextLanguage: "SPEECH_TO_TEXT_LANGUAGE",
  audioInputDeviceId: "AUDIO_INPUT_DEVICE_ID",
};
