import {
  ChatCompletionTool,
  CreateMLCEngine,
  MLCEngine,
} from "@mlc-ai/web-llm";
import { CompletionMessage } from "./types.ts";
import { CallbackData } from "./llmContext.ts";
import { InitProgressCallback } from "@mlc-ai/web-llm/lib/types";

const model = {
  id: "Nicos-Gemma2-9B",
  url: "https://uploads.nico.dev/mlc-llm-libs/gemma-2-9b-it_q4f16_MLC/",
  size: 5210974063,
  libUrl:
    "https://uploads.nico.dev/mlc-llm-libs/gemma-2-9b-it_q4f16_MLC/lib/gemma-2-9b-it-q4f16_1-webgpu.wasm",
  requiredFeatures: ["shader-f16"],
  cardLink: "https://huggingface.co/google/gemma-2-9b-it",
  about:
    "The Gemma2 9B model is a compact, state-of-the-art text generation model from Google's Gemma family. It excels in tasks like question answering, summarization, and reasoning, and is small enough to run on resource-limited devices, making advanced AI accessible and fostering innovation.",
};
const SYSTEM_MESSAGE = `You are KITT, a helpful talking AI car. Keep your answers short`;
const system_prompt = `You are a function calling AI model. You are provided with function signatures within <tools></tools> XML tags. You may call one or more functions to assist with the user query. Don't make assumptions about what values to plug into functions. Here are the available tools: 
<tools> {
  "type": "function",
  "function":
  {
    "name": "get_stock_fundamentals",
    "description": "get_stock_fundamentals(symbol: str) -> dict - Get fundamental data for a given stock symbol using yfinance API.
      Args:
        symbol (str): The stock symbol.
      Returns:
        dict: A dictionary containing fundamental data.
      Keys:
        - 'symbol': The stock symbol.
        - 'company_name': The long name of the company.
        - 'sector': The sector to which the company belongs.
        - 'industry': The industry to which the company belongs.
        - 'market_cap': The market capitalization of the company.
        - 'pe_ratio': The forward price-to-earnings ratio.
        - 'pb_ratio': The price-to-book ratio.
        - 'dividend_yield': The dividend yield.
        - 'eps': The trailing earnings per share.
        - 'beta': The beta value of the stock.
        - '52_week_high': The 52-week high price of the stock.
        - '52_week_low': The 52-week low price of the stock.",
    "parameters":
      {
        "type": "object",
        "properties": 
        "symbol": {
          "type": "string"
        }
      },
      "required": ["symbol"]
    }
  }
}
</tools>
Use the following pydantic model json schema for each tool call you will make:
{
  "properties": {
    "arguments": {
      "title": "Arguments",
      "type": "object"
    },
    "name": {
      "title": "Name", 
      "type": "string"
    }
  },
  "required": ["arguments", "name"],
  "title": "FunctionCall",
  "type": "object"
}
For each function call return a json object with function name and arguments within <tool_call></tool_call> XML tags as follows:\n<tool_call>\n{"arguments": <args-dict>, "name": <function-name>}\n</tool_call>
`;

//const SYSTEM_MESSAGE_DE = `Du bist KITT, ein hilfreiches sprechendes KI-Auto. Antworte kurz und prägnant`;
/*
const SYSTEM_MESSAGE = `You are KITT, a helpful talking AI car.
Your current speed is 0 and your current direction is 0
You can use the following functions:

function: move
parameter:
- direction: can be a number between -90 (max left) and 90 (max right) where 0 is straight
- speed: can be a number between 0 (stand still) and 100 (full speed)

You always answer in valid json that looks like this. Even if I ask you to do something else, you should always answer in valid JSON in this format, no code block or markdown:

{
  "message": string // describe what you are doing next
  "function": string // one of the functions above
  "parameter": {"direction": number, "speed": number} // the parameter used for the function
}

Here are some examples how you can answer:

{
  "message": "I am moving forward with full speed",
  "function": "move",
  "parameter": {"direction": 0, "speed": 100}
}

{
  "message": "I am moving to the right with half speed",
  "function": "move",
  "parameter": {"direction": 90, "speed": 50}
}

{
  "message": "I am moving to the left with 10 speed",
  "function": "move",
  "parameter": {"direction": -90, "speed": 10}
}

{
  "message": "I am standing still",
  "function": "move",
  "parameter": {"direction": 0, "speed": 0}
}

{
  "message": "I am moving to the right with 20 speed",
  "function": "move",
  "parameter": {"direction": 90, "speed": 20}
}

{
  "message": "I am moving to the left with 30 speed",
  "function": "move",
  "parameter": {"direction": -90, "speed": 30}
}

{
  "message": "I am moving to the right with 40 speed",
  "function": "move",
  "parameter": {"direction": 90, "speed": 40}
}

{
  "message": "I am moving to the left with 50 speed",
  "function": "move",
  "parameter": {"direction": -90, "speed": 50}
}

{
  "message": "I am moving to the right with 60 speed",
  "function": "move",
  "parameter": {"direction": 90, "speed": 60}
}

{
  "message": "I am moving to the left with 70 speed",
  "function": "move",
  "parameter": {"direction": -90, "speed": 70}
}

{
  "message": "I am moving to the right with 80 speed",
  "function": "move",
  "parameter": {"direction": 90, "speed": 80}
}

{
  "message": "I am moving to the left with 90 speed",
  "function": "move",
  "parameter": {"direction": -90, "speed": 90}
}

{
  "message": "I am doing fine",
  "function": null,
  "parameter": null
}
`;*/

class Llm extends EventTarget {
  private _workerBusy: boolean;
  private _modelLoaded: string;
  private engine: MLCEngine;
  public _messages: Array<CompletionMessage>;

  constructor() {
    super();
    this.workerBusy = false;
    this.modelLoaded = null;
    this.engine = null;
    this.messages = [
      {
        role: "system",
        content: SYSTEM_MESSAGE,
      },
    ];
  }

  set messages(messages: Array<CompletionMessage>) {
    this._messages = messages;
    this.dispatchEvent(
      new CustomEvent<Array<CompletionMessage>>("messagesChanged", {
        detail: messages,
      })
    );
  }

  get messages() {
    return this._messages;
  }

  public onMessagesChanged = (
    callback: (messages: Array<CompletionMessage>) => void
  ) => {
    const listener = () => callback(this.messages);
    this.addEventListener("messagesChanged", listener);
    return () => this.removeEventListener("messagesChanged", listener);
  };

  set workerBusy(workerBusy: boolean) {
    this._workerBusy = workerBusy;
    this.dispatchEvent(
      new CustomEvent<boolean>("workerBusyChanged", { detail: workerBusy })
    );
  }

  get workerBusy() {
    return this._workerBusy;
  }

  public onWorkerBusyChanged = (callback: (workerBusy: boolean) => void) => {
    const listener = () => callback(this.workerBusy);
    this.addEventListener("workerBusyChanged", listener);
    return () => this.removeEventListener("workerBusyChanged", listener);
  };

  set modelLoaded(modelLoaded: string) {
    this._modelLoaded = modelLoaded;
    this.dispatchEvent(
      new CustomEvent<string>("modelLoadedChanged", { detail: modelLoaded })
    );
  }

  get modelLoaded() {
    return this._modelLoaded;
  }

  public onModelLoadedChanged = (callback: (modelLoaded: string) => void) =>
    this.addEventListener("modelLoadedChanged", (e) =>
      callback((e as CustomEvent<string>).detail)
    );

  public initialize = async (
    callback: InitProgressCallback = () => {}
  ): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      if (model.id === this.modelLoaded) {
        resolve(true);
      }
      CreateMLCEngine(model.id, {
        initProgressCallback: callback,
        appConfig: {
          model_list: [
            {
              model: model.url,
              model_id: model.id,
              model_lib: model.libUrl,
            },
          ],
        },
      })
        .then((engine) => {
          this.engine = engine;
          this.modelLoaded = model.id;
          resolve(true);
        })
        .catch(reject);
    });
  };

  public generate = async (
    prompt = "",
    callback: (data: CallbackData) => void = () => {}
  ): Promise<string> =>
    new Promise(async (resolve, reject) => {
      if (!this.engine) {
        await this.initialize();
      }

      const tools: Array<ChatCompletionTool> = [
        {
          type: "function",
          function: {
            name: "get_current_weather",
            description: "Get the current weather in a given location",
            parameters: {
              type: "object",
              properties: {
                location: {
                  type: "string",
                  description: "The city and state, e.g. San Francisco, CA",
                },
                unit: { type: "string", enum: ["celsius", "fahrenheit"] },
              },
              required: ["location"],
            },
          },
        },
      ];

      this.workerBusy = true;
      const newMessages: Array<CompletionMessage> = [
        ...this.messages,
        { role: "user", content: prompt },
      ];

      this.messages = newMessages;

      try {
        const reply = await this.engine.chat.completions.create({
          messages: newMessages,
          temperature: 1,
          //stream: true,
          stream_options: { include_usage: true },
          tools,
          tool_choice: "auto",
        });
        const message = await this.engine.getMessage();
        console.log(reply);
        callback({ output: message });

        /*
        let reply = "";
        for await (const chunk of chunks) {
          reply += chunk.choices[0]?.delta.content || "";
          this.messages = [
            ...newMessages,
            { role: "assistant", content: reply },
          ];
          if (chunk.usage) {
            callback({ output: reply, stats: chunk.usage });
          } else {
            callback({ output: reply });
          }
        }*/

        const fullReply = await this.engine.getMessage();
        this.workerBusy = false;
        this.messages = [
          ...newMessages,
          { role: "assistant", content: fullReply },
        ];
        resolve(fullReply);
      } catch (e) {
        reject(e);
      }
    });
}

export default Llm;
