import Log from "@log";

import cleanUpJsonObject from "@utils/cleanUpJsonObject.ts";
import answerAsKitt from "@utils/llm/answerAsKitt.ts";
import LLM from "@utils/llm/llm.ts";

import {
  evaluateNextStepSystemPrompt,
  generateFinalAnswerSystemPrompt,
  xmlFunctionCallingSystemPrompt,
} from "./prompts.ts";
import {
  BasalGangliaFactory,
  EvaluateNextStepResponseSchema,
  FunctionDefinition,
} from "./types.ts";
import extractXmlFunctionCalls from "./utils/extractXmlFunctionCalls.ts";

class BasalGanglia implements BasalGangliaFactory {
  public llm = LLM;
  private functions: Array<FunctionDefinition<any>> = [];

  constructor() {}

  public addFunction = <T>(func: FunctionDefinition<T>) => {
    this.functions.push(func);
  };

  public startConversation = async (
    request: string,
    speak: (input: string) => void,
    { maxRounds = 4, startedAt = new Date() } = {}
  ) => {
    const systemPrompt = xmlFunctionCallingSystemPrompt(this.functions);
    const conversation = this.llm.createConversation(systemPrompt, 0);
    const calledFunctions: Array<string> = [];

    /*
    console.log("SYSTEM");
    console.log(systemPrompt);
     */

    Log.addEntry({
      category: "kittConversation",
      title: `started`,
      message: [
        {
          title: "systemPrompt",
          content: systemPrompt,
        },
      ],
    });

    const generate = async (query: string, round: number = 1) => {
      if (round > maxRounds) {
        Log.addEntry({
          category: "kittConversation",
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

      /*
      console.log("USER");
      console.log(query);
       */

      const response = await conversation.generate(query);
      const parsed = extractXmlFunctionCalls(response.output);

      /*
      console.log("AI");
      console.log(response.output);
       */

      Log.addEntry({
        category: "kittConversation",
        title: `generate response (Round ${round})`,
        message: [
          { title: "Query", content: query },
          {
            title: "Raw response",
            content: response.output,
          },
          {
            title: "Parsed response",
            content: parsed,
          },
        ],
      });

      const functionsToCall = parsed.functionCalls
        .map((call) => {
          const matchedFunction = this.functions.find(
            (func) => func.name === call.name
          );

          const alreadyCalled = calledFunctions.includes(call.name);

          if (matchedFunction && !alreadyCalled) {
            try {
              const matchedFunctionParameters =
                matchedFunction.parameters.parse(call.parameters);
              return {
                name: matchedFunction.name,
                handler: matchedFunction.handler,
                parameters: matchedFunctionParameters,
              };
            } catch (e) {
              console.error(e);
              return null;
            }
          } else {
            return null;
          }
        })
        .filter(Boolean);

      if (functionsToCall.length === 0) {
        const ended = new Date();
        Log.addEntry({
          category: "kittConversation",
          title: "finalAnswer",
          message: [
            { title: "", content: parsed.cleanText },
            {
              title: "Timing",
              content: `${(ended.getTime() - startedAt.getTime()) / 1000} seconds`,
            },
          ],
        });
        return parsed.cleanText;
      } else {
        speak(parsed.cleanText);
        const results = await Promise.all(
          functionsToCall.map(async (func) => {
            const toolCall = await func.handler(func.parameters, request);
            return toolCall.response;
          })
        );

        functionsToCall.forEach((func) => {
          calledFunctions.push(func.name);
        });
        Log.addEntry({
          category: "kittConversation",
          title: `function results`,
          message: results.map((r, i) => ({
            title:
              functionsToCall[i].name +
              ": " +
              Object.entries(functionsToCall[i].parameters)
                .map(([key, value]) => `${key}: ${value}`)
                .join(", "),
            content: r,
          })),
        });

        return await generate(
          results
            .map((r, i) => `${functionsToCall[i].name} result:\n\n${r}`)
            .join("\n\n"),
          round + 1
        );
      }
    };

    return await generate(request);
  };

  public evaluateNextStep = async (
    request: string,
    { maxRounds = 3, history = [], startedAt = new Date(), round = 1 }
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
