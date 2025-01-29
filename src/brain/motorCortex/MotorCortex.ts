import { MotorCortexStatus } from "./types.ts";

class MotorCortex extends EventTarget {
  private service: BluetoothRemoteGATTService;
  private characteristic: BluetoothRemoteGATTCharacteristic;
  private device: BluetoothDevice;
  private _status: MotorCortexStatus = MotorCortexStatus.DISCONNECTED;
  private _value: [number, number];
  private speed: number = 0;
  private turn: number = 0;

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
  };

  public disconnect = async () => {
    this.status = MotorCortexStatus.CONNECTING;
    this.device.gatt.disconnect();
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

    // Adjust to the byte range 0-200
    const [leftSpeed, rightSpeed] = [leftWheel + 100, rightWheel + 100];
    if (this.status === MotorCortexStatus.CONNECTED) {
      await this.send([leftSpeed, rightSpeed]);
    }
  };
}

export default MotorCortex;
