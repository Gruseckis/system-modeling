import produce from "immer";

interface ResultRow {
  modelingTimer: number;
  timerEvent1: number;
  timerEvent2: number;
  handleTimeEnd: number;
  systemFree: boolean;
  queueLength: number;
  queue: Array<EventType>;
}

type EventType = "1" | "2";

export class ModelSystem {
  private te1: number;
  private te2: number;
  private ts: number;
  private tm: number;
  private finishTime: number;
  private machineBusy = false;
  private machineQueue: Array<EventType> = [];
  private _machineStatus: Array<ResultRow>;

  constructor(endTime: number) {
    this.finishTime = endTime;
  }

  get machineStatus() {
    return this._machineStatus;
  }

  private initialSetUp() {
    this.te1 = this.getRandomInt(10); // event timer 1
    this.te2 = this.getRandomInt(23); // event timer 2
    this.tm = 0;
    this.ts = this.finishTime + 1;
    this.machineQueue = [];
    this._machineStatus = [];
  }

  private getRandomInt(max = 6, min = 5) {
    const random = Math.floor(Math.random() * (max - min)) + min;
    // console.log("random", random);
    return random; // Math.floor(Math.random() * (max - min)) + min;
  }

  private addToQueue(item) {
    this.machineQueue = Object.assign([], this.machineQueue);
    this.machineQueue.push(item);
  }

  private removeFromQueue() {
    this.machineQueue = Object.assign([], this.machineQueue);
    return this.machineQueue.pop();
  }

  public model() {
    this.initialSetUp();
    this.addResultRow();
    console.log(this._machineStatus);
    while (this.tm < this.finishTime) {
      const minValue = Math.min(this.te1, this.te2, this.ts, this.finishTime);
      // console.log("min value", minValue);
      // console.log("machine status", this.machineBusy);
      switch (minValue) {
        case this.te1:
          if (!this.machineBusy) {
            this.machineBusy = true;
            this.ts = minValue + this.getRandomInt(11); // handle timer 1
          } else {
            this.addToQueue("1");
          }
          this.te1 = minValue + this.getRandomInt(10);
          break;
        case this.te2:
          if (!this.machineBusy) {
            this.machineBusy = true;
            this.ts = minValue + this.getRandomInt(25); // handle timer 2
          } else {
            this.addToQueue("2");
          }
          this.te2 = minValue + this.getRandomInt(23);
          break;
        case this.ts:
          if (this.machineQueue.length === 0) {
            this.ts = this.finishTime + 1;
            this.machineBusy = false;
          } else {
            const eventType = this.removeFromQueue();
            if (eventType === "1") {
              this.ts = minValue + this.getRandomInt(17);
            } else {
              this.ts = minValue + this.getRandomInt(33);
            }
          }
          break;
        case this.finishTime:
          this.addResultRow();
          return;
      }
      this.tm = minValue;
      this.addResultRow();
      // console.log(this._machineStatus);
      // if (this._machineStatus.length > 10) {
      //   return;
      // }
    }
  }

  private addResultRow() {
    this._machineStatus = produce(this._machineStatus, draftStatus => {
      draftStatus.push({
        modelingTimer: this.tm,
        timerEvent1: this.te1,
        timerEvent2: this.te2,
        handleTimeEnd: this.ts,
        systemFree: this.machineBusy,
        queueLength: this.machineQueue.length,
        queue: this.machineQueue
      });
    });
  }
}
