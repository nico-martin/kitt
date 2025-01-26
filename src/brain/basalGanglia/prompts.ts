import { FunctionDefinition } from "@brain/basalGanglia/types.ts";

export const evaluateNextStepSystemPrompt = (
  functions: Array<FunctionDefinition>
) => `You are a function parser that matches user commands to available functions.
Available functions:
${functions
  .map(
    (func) => `
        ${func.name}: ${func.description}
        Parameters: ${func.parameters.map((p) => `${p.name} (${p.type}${p.required ? ", required" : ""})`).join(", ")}
        Examples: ${func.examples.join(", ")}
      `
  )
  .join("\n")}

Your job is to:
1. Identify which function best matches the user's intent
2. Extract any required parameters
3. Return ONLY a JSON object in this format:
\`\`\` JSON
{
  "functionName": "nameOfFunction",
  "parameters": {
    "paramName": "value"
  },
  "confidence": 0.8  // How confident you are in this match (0-1)
}
\`\`\` 
If no function matches well, return:
\`\`\` JSON
{ "functionName": null, "parameters": {}, "confidence": 0 }
\`\`\` 

DO NOT ADD ANY COMMENTS
`;
