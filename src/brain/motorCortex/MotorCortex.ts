import Log from "@log";
import { z } from "zod";

import { FunctionDefinition } from "@brain/basalGanglia/types.ts";

import { MotorCortexStatus } from "./types.ts";

const motorSpeedParameterSchema = z.object({
  speed: z
    .number()
    .min(-100)
    .max(100)
    .describe("Speed of the car, min -100, max 100")
    .transform((val) => Math.max(-100, Math.min(100, val))),
});

const motorTurnParameterSchema = z.object({
  direction: z
    .union([z.literal("left"), z.literal("right")])
    .describe("Make a turn 'left' or 'right'"),
});

class MotorCortex extends EventTarget {
  private service: BluetoothRemoteGATTService;
  private characteristic: BluetoothRemoteGATTCharacteristic;
  private device: BluetoothDevice;
  private _status: MotorCortexStatus = MotorCortexStatus.DISCONNECTED;
  private _value: [number, number];
  private speed: number = 0;
  private turn: number = 0;
  private pressedKey: string;

  constructor() {
    super();
    this._value = [100, 100];
  }

  public get status() {
    return this._status;
  }

  public set status(value) {
    this.dispatchEvent(new Event("statusChange"));
    this._status = value;
  }

  public onStatusChange = (callback: (status: MotorCortexStatus) => void) => {
    const listener = () => {
      callback(this.status);
    };
    this.addEventListener("statusChange", listener);
    return () => this.removeEventListener("statusChange", listener);
  };

  get value() {
    return this._value;
  }

  private set value(value: [number, number]) {
    this._value = value;
    this.dispatchEvent(new Event("valueChanged"));
  }

  public onValueChanged = (callback: (value: [number, number]) => void) => {
    const listener = () => callback(this.value);
    this.addEventListener("valueChanged", listener);
    return () => this.removeEventListener("valueChanged", listener);
  };

  private keydownListener = (event: KeyboardEvent) => {
    if (this.pressedKey === event.key) {
      return;
    }

    this.pressedKey = event.key;
    if (event.key === "ArrowUp") {
      this.send([200, 200]);
    } else if (event.key === "ArrowDown") {
      this.send([0, 0]);
    } else if (event.key === "ArrowLeft") {
      this.send([0, 200]);
    } else if (event.key === "ArrowRight") {
      this.send([200, 0]);
    }
  };

  private keyupListener = () => {
    if (
      ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
        this.pressedKey
      )
    ) {
      this.pressedKey = null;
      this.send([100, 100]);
    }
  };

  public connect = async () => {
    this.status = MotorCortexStatus.CONNECTING;
    const serviceUUid = "057b4ab6-2c6a-4138-b8e1-3529701d3f7a";
    const characteristicUUid = "41fd3aec-618c-48f6-901c-71e42ac4bf47";
    this.device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [serviceUUid] }],
      optionalServices: [serviceUUid],
    });
    this.device.addEventListener("gattserverdisconnected", () => {
      this.status = MotorCortexStatus.DISCONNECTED;
    });
    const server = await this.device.gatt.connect();
    this.service = await server.getPrimaryService(serviceUUid);
    this.characteristic =
      await this.service.getCharacteristic(characteristicUUid);
    this.characteristic.addEventListener("characteristicvaluechanged", (e) => {
      const v = (e.target as BluetoothRemoteGATTCharacteristic).value;
      this.value = [v.getUint8(0), v.getUint8(1)];
    });
    this.characteristic.startNotifications();
    const v = await this.characteristic.readValue();
    this.value = [v.getUint8(0), v.getUint8(1)];
    this.status = MotorCortexStatus.CONNECTED;
    window.addEventListener("keydown", this.keydownListener);
    window.addEventListener("keyup", this.keyupListener);
  };

  public disconnect = async () => {
    this.status = MotorCortexStatus.CONNECTING;
    this.device.gatt.disconnect();
    window.removeEventListener("keydown", this.keydownListener);
    window.removeEventListener("keyup", this.keyupListener);
  };

  private send = async (value: [number, number]) => {
    const buffer = new ArrayBuffer(2);
    const view = new DataView(buffer);
    view.setUint8(0, value[0]);
    view.setUint8(1, value[1]);
    return await this.characteristic.writeValue(buffer);
  };

  public changeSpeed = async (speed: number) => {
    this.speed = speed > 100 ? 100 : speed < -100 ? -100 : speed;
    await this.updateCharacteristics();
  };

  public changeTurn = async (turn: number) => {
    this.turn = turn > 90 ? 90 : turn < -90 ? -90 : turn;
    await this.updateCharacteristics();
  };

  private calculateWheelSpeeds = (
    speed: number,
    turn: number,
    throttling: number = 1
  ): { leftWheel: number; rightWheel: number } => {
    turn = Math.max(-90, Math.min(90, turn));
    const leftWheelFactor = turn <= 0 ? (90 + turn) / 90 : 1;
    const rightWheelFactor = turn >= 0 ? (90 - turn) / 90 : 1;

    const leftWheel = Math.round(speed * leftWheelFactor) * throttling;
    const rightWheel = Math.round(speed * rightWheelFactor) * throttling;

    return { leftWheel, rightWheel };
  };

  private updateCharacteristics = async (): Promise<void> => {
    const { leftWheel, rightWheel } = this.calculateWheelSpeeds(
      this.speed,
      this.turn,
      1
    );

    if (this.status === MotorCortexStatus.CONNECTED) {
      await this.send([leftWheel + 100, rightWheel + 100]);
    }
  };

  public changeSpeedFunction: FunctionDefinition<
    z.infer<typeof motorSpeedParameterSchema>
  > = {
    name: "changeSpeed",
    description:
      "Change the speed of the car. Your current Speed is " + this.speed,
    parameters: motorSpeedParameterSchema,
    examples: [
      {
        query: "Lets go full speed forward",
        parameters: { speed: 100 },
      },
      {
        query: "I think wee need to slow down a bit",
        parameters: { speed: 50 },
      },
      {
        query: "Please stop",
        parameters: { speed: 0 },
      },
      {
        query: "Let's go backwards",
        parameters: { speed: -50 },
      },
    ],
    handler: async (data) => {
      const { speed } = motorSpeedParameterSchema.parse(data);
      Log.addEntry({
        category: "changeSpeed",
        title: "call function with",
        message: [{ title: "data", content: speed }],
      });
      const boundarySpeed = speed < -100 ? -100 : speed > 100 ? 100 : speed;
      if (this.status === MotorCortexStatus.CONNECTED) {
        //await this.changeSpeed(boundarySpeed);
        await this.send([boundarySpeed + 100, boundarySpeed + 100]);
        new Promise((resolve) => setTimeout(resolve, 2000)).then(() =>
          this.send([100, 100])
        );
        Log.addEntry({
          category: "changeSpeed",
          title: "changeSpeed",
          message: [{ title: "data", content: boundarySpeed }],
        });
      } else {
        Log.addEntry({
          category: "changeSpeed",
          title: "not connected",
          message: [
            {
              title: "",
              content: "could not change because car is not connected",
            },
          ],
        });
      }
      const response =
        this.status !== MotorCortexStatus.CONNECTED
          ? "Tell the user that you are not connected to the car"
          : boundarySpeed === 0
            ? "Tell the user that you just stopped"
            : `Tell the user that you changed the speed to ${boundarySpeed}%`;
      Log.addEntry({
        category: "changeSpeed",
        title: "response",
        message: [{ title: "", content: response }],
      });
      return { response, maybeNextStep: false };
    },
  };

  public makeTurnFunction: FunctionDefinition<
    z.infer<typeof motorTurnParameterSchema>
  > = {
    name: "make Turn",
    description: "Change the direction of the car.",
    parameters: motorTurnParameterSchema,
    examples: [
      { query: "Let's turn left", parameters: { direction: "left" } },
      { query: "Let's turn right", parameters: { direction: "right" } },
    ],
    handler: async ({ direction }) => {
      Log.addEntry({
        category: "makeTurn",
        title: "call function with",
        message: [{ title: "data", content: direction }],
      });

      let response = "";
      if (this.status !== MotorCortexStatus.CONNECTED) {
        Log.addEntry({
          category: "makeTurn",
          title: "not connected",
          message: [
            {
              title: "",
              content: "could not change because car is not connected",
            },
          ],
        });
        response = "Tell the user that you are not connected to the car";
      } else {
        const waitFor90Degrees = 800;
        if (direction === "left") {
          await this.send([100, 200]);
          new Promise((resolve) => setTimeout(resolve, waitFor90Degrees)).then(
            () => this.send([100, 100])
          );
          response = "tell the user that you turned left";
        }
        if (direction === "right") {
          await this.send([200, 100]);
          new Promise((resolve) => setTimeout(resolve, waitFor90Degrees)).then(
            () => this.send([100, 100])
          );
          response = "tell the user that you turned right";
        }
      }

      Log.addEntry({
        category: "changeDirection",
        title: "response",
        message: [{ title: "", content: response }],
      });
      return { response, maybeNextStep: false };
    },
  };
}

export default MotorCortex;
