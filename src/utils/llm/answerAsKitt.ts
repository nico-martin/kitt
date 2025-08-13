import { GenerateFn } from "@utils/llm/types.ts";

import { answerAsKittSystemPrompt } from "@brain/basalGanglia/prompts.ts";

import llm from "./llm.ts";

let conversation: { generate: GenerateFn };

const answerAsKitt = async (request: string) => {
  if (!conversation)
    conversation = await llm.createConversation(
      answerAsKittSystemPrompt(),
      0.5
    );

  return (await conversation.generate(request)).output;
};

export default answerAsKitt;
