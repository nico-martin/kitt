type FunctionCall = {
  name: string;
  parameters: Record<string, string | number>;
};

const extractXmlFunctionCalls = (
  input: string
): {
  cleanText: string;
  functionCalls: FunctionCall[];
} => {
  const functionCalls: FunctionCall[] = [];

  // Regex to match <functionCall>...</functionCall>
  const functionCallRegex = /<functionCall>([\s\S]*?)<\/functionCall>/g;

  // Replace function calls and extract their data
  const cleanText = input.replace(functionCallRegex, (match) => {
    // Extract <name>...</name>
    const nameMatch = match.match(/<name>(.*?)<\/name>/);
    const functionName = nameMatch ? nameMatch[1] : "";

    // Extract parameters
    const parameters: Record<string, string | number> = {};
    const parametersSectionMatch = match.match(
      /<parameters>([\s\S]*?)<\/parameters>/
    );
    if (parametersSectionMatch) {
      const parametersSection = parametersSectionMatch[1];

      // Regex to extract parameter name, type, and value
      const paramRegex = /<([^\s>]+)(?:\s+type=\"(.*?)\")?>(.*?)<\/\1>/g;
      let paramMatch;
      while ((paramMatch = paramRegex.exec(parametersSection)) !== null) {
        const paramName = paramMatch[1];
        const paramType = paramMatch[2] || "string"; // Default to string if type not specified
        const paramValueRaw = paramMatch[3];
        let paramValue: string | number = paramValueRaw;

        // Convert value based on type
        if (paramType === "number") {
          paramValue = parseFloat(paramValueRaw);
        }

        parameters[paramName] = paramValue;
      }
    }

    functionCalls.push({ name: functionName, parameters });
    return "";
  });

  return { cleanText: cleanText.trim(), functionCalls };
};

export default extractXmlFunctionCalls;
