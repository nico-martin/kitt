export interface SettingsFormValues {
  llmProvider: string;
  geminiApiKey: string;
  speechToTextProvider: string;
  speechToTextLanguage: string;
  audioInputDeviceId: string;
  textToSpeechProvider: string;
  operatorName: string;
}

export enum SpeechToTextProvider {
  WHISPER = "whisper",
  BROWSER_SPEECH_RECOGNITION = "browser_speech_recognition",
}

export enum TextToSpeechProvider {
  KOKORO = "kokoro",
  BROWSER_SPEECH_SYNTHESIS = "browser_speech_synthesis",
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
  speechToTextProvider: SpeechToTextProvider.WHISPER,
  speechToTextLanguage: "en",
  audioInputDeviceId: "",
  textToSpeechProvider: TextToSpeechProvider.BROWSER_SPEECH_SYNTHESIS,
  operatorName: "",
};

export const LOCAL_STORAGE_KEYS: Record<keyof SettingsFormValues, string> = {
  geminiApiKey: "GOOGLE_AI_STUDIO_API_KEY",
  llmProvider: "KITT_LLM_PROVIDER",
  speechToTextProvider: "SPEECH_TO_TEXT_PROVIDER",
  speechToTextLanguage: "SPEECH_TO_TEXT_LANGUAGE",
  audioInputDeviceId: "AUDIO_INPUT_DEVICE_ID",
  textToSpeechProvider: "TEXT_TO_SPEECH_PROVIDER",
  operatorName: "OPERATOR_NAME",
};

export const LANGUAGES: Array<{
  lang: string;
  label: string;
  locale: string;
  whisper: boolean;
}> = [
  { lang: "en", label: "English", locale: "en-US", whisper: true },
  { lang: "zh", label: "Chinese", locale: "zh-CN", whisper: true },
  { lang: "de", label: "German", locale: "de-DE", whisper: true },
  { lang: "es", label: "Spanish, Castilian", locale: "es-ES", whisper: true },
  { lang: "ru", label: "Russian", locale: "ru-RU", whisper: true },
  { lang: "ko", label: "Korean", locale: "ko-KR", whisper: true },
  { lang: "fr", label: "French", locale: "fr-FR", whisper: true },
  { lang: "ja", label: "Japanese", locale: "ja-JP", whisper: true },
  { lang: "pt", label: "Portuguese", locale: "pt-PT", whisper: true },
  { lang: "tr", label: "Turkish", locale: "tr-TR", whisper: true },
  { lang: "pl", label: "Polish", locale: "pl-PL", whisper: true },
  { lang: "ca", label: "Catalan, Valencian", locale: "ca-ES", whisper: true },
  { lang: "nl", label: "Dutch, Flemish", locale: "nl-NL", whisper: true },
  { lang: "ar", label: "Arabic", locale: "ar-SA", whisper: true },
  { lang: "sv", label: "Swedish", locale: "sv-SE", whisper: true },
  { lang: "it", label: "Italian", locale: "it-IT", whisper: true },
  { lang: "id", label: "Indonesian", locale: "id-ID", whisper: true },
  { lang: "hi", label: "Hindi", locale: "hi-IN", whisper: true },
  { lang: "fi", label: "Finnish", locale: "fi-FI", whisper: true },
  { lang: "vi", label: "Vietnamese", locale: "vi-VN", whisper: true },
  { lang: "he", label: "Hebrew", locale: "he-IL", whisper: true },
  { lang: "uk", label: "Ukrainian", locale: "uk-UA", whisper: true },
  { lang: "el", label: "Greek", locale: "el-GR", whisper: true },
  { lang: "ms", label: "Malay", locale: "ms-MY", whisper: true },
  { lang: "cs", label: "Czech", locale: "cs-CZ", whisper: true },
  {
    lang: "ro",
    label: "Romanian, Moldavian, Moldovan",
    locale: "ro-RO",
    whisper: true,
  },
  { lang: "da", label: "Danish", locale: "da-DK", whisper: true },
  { lang: "hu", label: "Hungarian", locale: "hu-HU", whisper: true },
  { lang: "ta", label: "Tamil", locale: "ta-IN", whisper: true },
  { lang: "no", label: "Norwegian", locale: "no-NO", whisper: true },
  { lang: "th", label: "Thai", locale: "th-TH", whisper: true },
  { lang: "ur", label: "Urdu", locale: "ur-PK", whisper: true },
  { lang: "hr", label: "Croatian", locale: "hr-HR", whisper: true },
  { lang: "bg", label: "Bulgarian", locale: "bg-BG", whisper: true },
  { lang: "lt", label: "Lithuanian", locale: "lt-LT", whisper: true },
  { lang: "la", label: "Latin", locale: "la-LA", whisper: true },
  { lang: "mi", label: "Maori", locale: "mi-NZ", whisper: true },
  { lang: "ml", label: "Malayalam", locale: "ml-IN", whisper: true },
  { lang: "cy", label: "Welsh", locale: "cy-GB", whisper: true },
  { lang: "sk", label: "Slovak", locale: "sk-SK", whisper: true },
  { lang: "te", label: "Telugu", locale: "te-IN", whisper: true },
  { lang: "fa", label: "Persian", locale: "fa-IR", whisper: true },
  { lang: "lv", label: "Latvian", locale: "lv-LV", whisper: true },
  { lang: "bn", label: "Bengali", locale: "bn-IN", whisper: true },
  { lang: "sr", label: "Serbian", locale: "sr-RS", whisper: true },
  { lang: "az", label: "Azerbaijani", locale: "az-AZ", whisper: true },
  { lang: "sl", label: "Slovenian", locale: "sl-SI", whisper: true },
  { lang: "kn", label: "Kannada", locale: "kn-IN", whisper: true },
  { lang: "et", label: "Estonian", locale: "et-EE", whisper: true },
  { lang: "mk", label: "Macedonian", locale: "mk-MK", whisper: true },
  { lang: "br", label: "Breton", locale: "br-FR", whisper: true },
  { lang: "eu", label: "Basque", locale: "eu-ES", whisper: true },
  { lang: "is", label: "Icelandic", locale: "is-IS", whisper: true },
  { lang: "hy", label: "Armenian", locale: "hy-AM", whisper: true },
  { lang: "ne", label: "Nepali", locale: "ne-NP", whisper: true },
  { lang: "mn", label: "Mongolian", locale: "mn-MN", whisper: true },
  { lang: "bs", label: "Bosnian", locale: "bs-BA", whisper: true },
  { lang: "kk", label: "Kazakh", locale: "kk-KZ", whisper: true },
  { lang: "sq", label: "Albanian", locale: "sq-AL", whisper: true },
  { lang: "sw", label: "Swahili", locale: "sw-KE", whisper: true },
  { lang: "gl", label: "Galician", locale: "gl-ES", whisper: true },
  { lang: "mr", label: "Marathi", locale: "mr-IN", whisper: true },
  { lang: "pa", label: "Punjabi, Panjabi", locale: "pa-IN", whisper: true },
  { lang: "si", label: "Sinhala, Sinhalese", locale: "si-LK", whisper: true },
  { lang: "km", label: "Khmer", locale: "km-KH", whisper: true },
  { lang: "sn", label: "Shona", locale: "sn-ZW", whisper: true },
  { lang: "yo", label: "Yoruba", locale: "yo-NG", whisper: true },
  { lang: "so", label: "Somali", locale: "so-SO", whisper: true },
  { lang: "af", label: "Afrikaans", locale: "af-ZA", whisper: true },
  { lang: "oc", label: "Occitan", locale: "oc-FR", whisper: true },
  { lang: "ka", label: "Georgian", locale: "ka-GE", whisper: true },
  { lang: "be", label: "Belarusian", locale: "be-BY", whisper: true },
  { lang: "tg", label: "Tajik", locale: "tg-TJ", whisper: true },
  { lang: "sd", label: "Sindhi", locale: "sd-IN", whisper: true },
  { lang: "gu", label: "Gujarati", locale: "gu-IN", whisper: true },
  { lang: "am", label: "Amharic", locale: "am-ET", whisper: true },
  { lang: "yi", label: "Yiddish", locale: "yi-001", whisper: true },
  { lang: "lo", label: "Lao", locale: "lo-LA", whisper: true },
  { lang: "uz", label: "Uzbek", locale: "uz-UZ", whisper: true },
  { lang: "fo", label: "Faroese", locale: "fo-FO", whisper: true },
  {
    lang: "ht",
    label: "Haitian Creole/Haitian",
    locale: "ht-HT",
    whisper: true,
  },
  { lang: "ps", label: "Pashto/Pushto", locale: "ps-AF", whisper: true },
  { lang: "tk", label: "Turkmen", locale: "tk-TM", whisper: true },
  { lang: "nn", label: "Nynorsk", locale: "nn-NO", whisper: true },
  { lang: "mt", label: "Maltese", locale: "mt-MT", whisper: true },
  { lang: "sa", label: "Sanskrit", locale: "sa-IN", whisper: true },
  {
    lang: "lb",
    label: "Luxembourgish, Letzeburgesch",
    locale: "lb-LU",
    whisper: true,
  },
  { lang: "my", label: "Myanmar, Burmese", locale: "my-MM", whisper: true },
  { lang: "bo", label: "Tibetan", locale: "bo-CN", whisper: true },
  { lang: "tl", label: "Tagalog", locale: "tl-PH", whisper: true },
  { lang: "mg", label: "Malagasy", locale: "mg-MG", whisper: true },
  { lang: "as", label: "Assamese", locale: "as-IN", whisper: true },
  { lang: "tt", label: "Tatar", locale: "tt-RU", whisper: true },
  { lang: "haw", label: "Hawaiian", locale: "haw-US", whisper: true },
  { lang: "ln", label: "Lingala", locale: "ln-CD", whisper: true },
  { lang: "ha", label: "Hausa", locale: "ha-NG", whisper: true },
  { lang: "ba", label: "Bashkir", locale: "ba-RU", whisper: true },
  { lang: "jw", label: "Javanese", locale: "jw-ID", whisper: true },
  { lang: "su", label: "Sundanese", locale: "su-ID", whisper: true },
];
