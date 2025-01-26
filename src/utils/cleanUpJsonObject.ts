const cleanUpJsonObject = (text: string): string => {
  let cleanText = text
    .replace(/```json\s*([\s\S]*?)```/g, "$1")
    .replace(/,\s*([}\]])/g, "$1")
    .trim();

  return cleanText;
};

export default cleanUpJsonObject;
