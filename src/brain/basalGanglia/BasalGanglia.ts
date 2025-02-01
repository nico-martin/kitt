import Log from "@log";

import cleanUpJsonObject from "@utils/cleanUpJsonObject.ts";
import answerAsKitt from "@utils/llm/answerAsKitt.ts";
import LLM from "@utils/llm/llm.ts";

import { evaluateNextStepSystemPrompt } from "@brain/basalGanglia/prompts.ts";

import {
  BasalGangliaFactory,
  EvaluateNextStepResponseSchema,
  FunctionDefinition,
} from "./types.ts";

class BasalGanglia implements BasalGangliaFactory {
  public llm = LLM;
  private functions: Array<FunctionDefinition> = [];

  constructor() {}

  public addFunction = <T>(func: FunctionDefinition<T>) => {
    this.functions.push(func);
  };

  public evaluateNextStep = async (request: string): Promise<string> => {
    const started = new Date();
    Log.addEntry({
      category: "functionCall",
      title: "evaluate request",
      message: [
        {
          title: "systemPrompt",
          content: evaluateNextStepSystemPrompt(this.functions),
        },
        { title: "Request", content: request },
      ],
    });
    const conversation = this.llm.createConversation(
      evaluateNextStepSystemPrompt(this.functions),
      0
    );

    const response = await conversation.generate(request);
    const responseOutput = response.output;

    const responseCall = EvaluateNextStepResponseSchema.parse(
      JSON.parse(cleanUpJsonObject(responseOutput))
    );
    Log.addEntry({
      category: "functionCall",
      title: "response",
      message: [
        {
          title: "Raw response",
          content: responseOutput,
        },
        {
          title: "Parsed response",
          content: responseCall,
        },
      ],
    });

    const matchedFunction = this.functions.find(
      (func) => func.name === responseCall.functionName
    );

    if (!matchedFunction) {
      const answer = await answerAsKitt(request);
      Log.addEntry({
        category: "functionCall",
        title: "finalAnswer",
        message: [{ title: "", content: answer }],
      });
      return answer;
    }

    Log.addEntry({
      category: "functionCall",
      title: `function "${matchedFunction.name}"`,
      message: [
        {
          title: `call for ${matchedFunction.name} with parameters:`,
          content: responseCall.parameters,
        },
      ],
    });

    const finalPrompt = await matchedFunction.handler(
      responseCall.parameters,
      request
    );

    const finalAnswer = await answerAsKitt(finalPrompt);
    Log.addEntry({
      category: "functionCall",
      title: "finalAnswer",
      message: [{ title: "", content: finalAnswer }],
    });
    const ended = new Date();
    Log.addEntry({
      category: "functionCall",
      title: `ended after ${(ended.getTime() - started.getTime()) / 1000} seconds`,
    });
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
