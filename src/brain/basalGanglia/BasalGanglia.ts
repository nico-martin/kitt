import Log from "@log";

import cleanUpJsonObject from "@utils/cleanUpJsonObject.ts";
import answerAsKitt from "@utils/llm/answerAsKitt.ts";
import LLM from "@utils/llm/llm.ts";

import {
  evaluateNextStepSystemPrompt,
  generateFinalAnswerSystemPrompt,
} from "@brain/basalGanglia/prompts.ts";

import {
  BasalGangliaFactory,
  EvaluateNextStepResponseSchema,
  FunctionDefinition,
} from "./types.ts";

class BasalGanglia implements BasalGangliaFactory {
  public llm = LLM;
  private functions: Array<FunctionDefinition<any>> = [];

  constructor() {}

  public addFunction = <T>(func: FunctionDefinition<T>) => {
    this.functions.push(func);
  };

  public evaluateNextStep = async (
    request: string,
    {
      maxRounds = 3,
      history = [],
      startedAt = new Date(),
      round = 1,
      triggerStartSpeak = null,
    }
  ): Promise<string> => {
    if (round > maxRounds) {
      Log.addEntry({
        category: "evaluateNextStep",
        title: "Error: Max rounds reached",
        message: [
          {
            title: "Error",
            content: `Max rounds reached: ${round} of ${maxRounds}`,
          },
        ],
      });
      return "I am sorry, I could not find a final answer.";
    }

    const requestWithHistory =
      history.length > 0
        ? `CONTEXT TO ANSWER THE QUESTION:
        
${history.map((entry) => entry.response).join("\n")}

REQUEST:
${request}`
        : request;

    const systemPrompt =
      round === maxRounds
        ? generateFinalAnswerSystemPrompt()
        : evaluateNextStepSystemPrompt(this.functions);

    Log.addEntry({
      category: "evaluateNextStep",
      title: `evaluate request (Round ${round})`,
      message: [
        { title: "rounds", content: `${round} of max.  ${maxRounds}` },
        {
          title: "systemPrompt",
          content: systemPrompt,
        },
        { title: "Request", content: requestWithHistory },
      ],
    });

    const conversation = this.llm.createConversation(systemPrompt, 0);
    const response = await conversation.generate(requestWithHistory);
    const responseOutput = response.output;
    const responseCall = EvaluateNextStepResponseSchema.parse(
      JSON.parse(cleanUpJsonObject(responseOutput))
    );

    Log.addEntry({
      category: "evaluateNextStep",
      title: `response (Round ${round})`,
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

    if (!matchedFunction || responseCall.finalAnswer) {
      if (responseCall.finalAnswer) {
        const ended = new Date();
        Log.addEntry({
          category: "evaluateNextStep",
          title: "finalAnswer",
          message: [
            { title: "", content: responseCall.finalAnswer },
            {
              title: "Timing",
              content: `${(ended.getTime() - startedAt.getTime()) / 1000} seconds`,
            },
          ],
        });

        return responseCall.finalAnswer;
      } else {
        Log.addEntry({
          category: "evaluateNextStep",
          title: "finalAnswer",
          message: [{ title: "Error", content: "No final answer" }],
        });
        return "I am sorry, I could not find a final answer";
      }
    }

    if (
      triggerStartSpeak &&
      round === 1 &&
      responseCall.functionName === "searchEpisode"
    ) {
      Log.addEntry({
        category: "evaluateNextStep",
        title: "triggerStartSpeak",
        message: [{ title: "triggerStartSpeak", content: request }],
      });
      triggerStartSpeak(request);
    }

    const matchedFunctionParameters = matchedFunction.parameters.parse(
      responseCall.parameters
    );

    Log.addEntry({
      category: "functionCall",
      title: `function "${matchedFunction.name}"`,
      message: [
        {
          title: `call for ${matchedFunction.name} with parameters:`,
          content: matchedFunctionParameters,
        },
      ],
    });

    const toolCall = await matchedFunction.handler(
      responseCall.parameters,
      request
    );

    if (!toolCall.maybeNextStep) {
      const ended = new Date();
      Log.addEntry({
        category: "functionCall",
        title: "finalAnswer",
        message: [
          { title: "", content: toolCall.response },
          {
            title: "Timing",
            content: `${(ended.getTime() - startedAt.getTime()) / 1000} seconds`,
          },
        ],
      });

      return answerAsKitt(toolCall.response);
    }

    history.push({
      role: "function",
      name: matchedFunction.name,
      response: toolCall.response,
    });

    return this.evaluateNextStep(request, {
      maxRounds,
      history,
      startedAt,
      round: round + 1,
      triggerStartSpeak,
    });

    /*const finalAnswer = await answerAsKitt(finalPrompt);
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
