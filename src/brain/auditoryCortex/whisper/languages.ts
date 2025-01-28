import { LANGUAGES } from "@utils/settings/constants.ts";

const WHISPER_LANGUAGES = LANGUAGES.filter(({ whisper }) => whisper).map(
  (language) => ({ value: language.lang, label: language.label })
);

export default WHISPER_LANGUAGES;
