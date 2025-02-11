import { answerAsKittSystemPrompt } from "@brain/basalGanglia/prompts.ts";

import llm from "./llm.ts";

const answerAsKitt = async (request: string) => {
  const newConversation = llm.createConversation(
    answerAsKittSystemPrompt(),
    0.5
  );

  return (await newConversation.generate(request)).output;
};

export default answerAsKitt;
