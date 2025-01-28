import { evaluateNextStepSystemPrompt } from "@brain/basalGanglia/prompts.ts";

import cleanUpJsonObject from "@utils/cleanUpJsonObject.ts";
import answerAsKitt from "@utils/llm/answerAsKitt.ts";
import LLM from "@utils/llm/llm.ts";

import {
  BasalGangliaFactory,
  EvaluateNextStepResponseSchema,
  FunctionDefinition,
} from "./types.ts";

class BasalGanglia implements BasalGangliaFactory {
  public llm = LLM;
  private functions: Array<FunctionDefinition> = [];
  // @ts-ignore
  private about =
    "The basal ganglia are a group of brain structures linked together, handling complex processes that affect your entire body. While best known for their role in controlling your body's ability to move, experts now know they also play a role in several other functions, such as learning, emotional processing and more.";
  constructor() {}

  public addFunction = <T>(func: FunctionDefinition<T>) => {
    this.functions.push(func);
  };

  public evaluateNextStep = async (request: string): Promise<string> => {
    console.log("[functionCall] EVALUATING REQUEST");
    console.log("[functionCall] REQUEST:", request);
    const conversation = this.llm.createConversation(
      evaluateNextStepSystemPrompt(this.functions),
      0.1
    );
    const response = await conversation.generate(request);
    const responseCall = EvaluateNextStepResponseSchema.parse(
      JSON.parse(cleanUpJsonObject(response.output))
    );
    console.log("[functionCall] RESPONSE CALL");
    console.log(responseCall);

    const matchedFunction = this.functions.find(
      (func) => func.name === responseCall.functionName
    );

    if (!matchedFunction) {
      return await answerAsKitt(request);
    }

    const callResult = await matchedFunction.handler(
      responseCall.parameters,
      request
    );

    console.log("[functionCall] CALL RESULT");
    console.log(callResult);

    const finalAnswer = await answerAsKitt(request);
    console.log("FINAL ANSWER");
    console.log(finalAnswer);
    return finalAnswer;

    /**
    const newConversation = this.llm.createConversation(
      "You are a helpful AI assistant",
      1
    );

    const finalAnswer = (await newConversation.generate(callResult)).output;

    console.log("FINAL ANSWER");
    console.log(finalAnswer);
    return finalAnswer;**/
  };
}

export default BasalGanglia;
