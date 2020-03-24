import produce from "immer";
import { timer, noop } from 'rxjs';
import { take } from 'rxjs/operators'
import { FormControl } from '@angular/forms';
import random from 'random';

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
  public machineTime = 0;
  public simulationStatus: ResultRow;
  public showingSimulation = false;
  private finishTime: number;
  private te1: number;
  private te2: number;
  private ts: number;
  private tm: number;
  private machineBusy = false;
  private machineQueue: Array<EventType>;
  private _machineStatus: Array<ResultRow>;

  constructor(endTime: number) {
    this.finishTime = endTime;
    this.machineQueue = [];
  }

  get machineStatus() {
    return this._machineStatus;
  }

  private initialSetUp() {
    this.te1 = this.erlangDistribution(3, 0.25); // event timer 1
    this.te2 = this.exponentialRandom(2); // event timer 2
    this.tm = 0;
    this.ts = this.finishTime + 1;
    this.machineQueue = [];
    this._machineStatus = [];
  }

  private getRandomInt(max = 6, min = 5) {
    const myRandom = Math.floor(Math.random() * (max - min)) + min;
    // console.log("random", random);
    return myRandom; // Math.floor(Math.random() * (max - min)) + min;
  }

  // Random generators
  private exponentialRandom(lambda: number): number {
    console.log(random.float(0,1))
    const u = random.float(0.000000001, 0.999999999);
    const myRandom = (-1/lambda) * (Math.log10(1-u))
    return myRandom; 
  }

  private erlangDistribution(timesL: number, lambda: number): number {
    let sum = 0;
    for (let i = 0; i < timesL; i++) {
      sum = sum + this.exponentialRandom(lambda)
    }
    return sum;
  }

  private normalDistribution(sigma: number, median: number): number {
    const n = 100;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum = sum + random.float(0, 1);
    }
    const z = (sum - n/2)/(Math.sqrt(n/12))
    return ((z*sigma) + median)
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
    // console.log(this._machineStatus);
    while (this.tm < this.finishTime) {
      const minValue = Math.min(this.te1, this.te2, this.ts, this.finishTime);
      // console.log("min value", minValue);
      // console.log("machine status", this.machineBusy);
      switch (minValue) {
        case this.te1:
          if (!this.machineBusy) {
            this.machineBusy = true;
            this.ts = minValue + this.normalDistribution(1.5, 14); // handle timer 1
          } else {
            this.addToQueue("1");
          }
          this.te1 = minValue + this.erlangDistribution(3, 0.25);
          break;
        case this.te2:
          if (!this.machineBusy) {
            this.machineBusy = true;
            this.ts = minValue + this.exponentialRandom(3); // handle timer 2
          } else {
            this.addToQueue("2");
          }
          this.te2 = minValue + this.exponentialRandom(2);
          break;
        case this.ts:
          if (this.machineQueue.length === 0) {
            this.ts = this.finishTime + 1;
            this.machineBusy = false;
          } else {
            const eventType = this.removeFromQueue();
            if (eventType === "1") {
              this.ts = minValue + this.normalDistribution(1.5, 14);
            } else {
              this.ts = minValue + this.exponentialRandom(3);
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

  public visualizeData(endTime: FormControl, timerSpeed: FormControl) {
    this.finishTime = parseInt(endTime.value);
    console.log(timerSpeed.value)
    endTime.disable();
    this.model();
    const counter = timer(500,timerSpeed.value);
    timerSpeed.disable();
    this.showingSimulation = true;
    counter.pipe(take(this.finishTime + 1)).subscribe(time => {
      this.machineTime = time;
      const matchingStatus = this._machineStatus.find(item => item.modelingTimer === time);
      // console.log(matchingStatus);
      if(matchingStatus) {
        this.simulationStatus = matchingStatus;
      }
    },noop,
    ()=> {
      endTime.enable();
      timerSpeed.enable();
    });
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
