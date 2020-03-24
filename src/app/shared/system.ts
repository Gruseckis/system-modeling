import produce from 'immer';
// import { timer, noop } from 'rxjs';
// import { take } from 'rxjs/operators';
import { FormControl } from '@angular/forms';
import random from 'random';
import seedrandom from 'seedrandom';
import { Parser } from 'json2csv';
// import { writeFileSync } from 'fs';

interface ResultRow {
  modelingTimer: number;
  timerEvent1: number;
  timerEvent2: number;
  handleTimeEnd: number;
  systemFree: boolean;
  queueLength: number;
  queue: Array<EventType>;
}

type EventType = '1' | '2';

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
  private te1Times = [];
  private te2Times = [];
  private te1HandleTimes = [];
  private te2HandleTimes = [];

  constructor(endTime: number) {
    this.finishTime = endTime;
    this.machineQueue = [];
    random.use(seedrandom('mySeed'));
  }

  get machineStatus() {
    return this._machineStatus;
  }

  private initialSetUp() {
    this.te1 = this.erlangDistribution(3, 0.25); // event timer 1
    this.te1Times.push(this.te1);
    this.te2 = this.exponentialRandom(2); // event timer 2
    this.te2Times.push(this.te2);
    this.tm = 0;
    this.ts = this.finishTime + 1;
    this.machineQueue = [];
    this._machineStatus = [];
  }

  // Random generators
  private exponentialRandom(lambda: number): number {
    const u = random.float(0.000000001, 0.999999999);
    const myRandom = (-1 / lambda) * Math.log(1 - u);
    return myRandom;
  }

  private erlangDistribution(timesL: number, lambda: number): number {
    let sum = 0;
    for (let i = 0; i < timesL; i++) {
      sum = sum + this.exponentialRandom(lambda);
    }
    return sum;
  }

  private normalDistribution(sigma: number, median: number): number {
    const n = 100;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum = sum + random.float(0, 1);
    }
    const z = (sum - n / 2) / Math.sqrt(n / 12);
    return z * sigma + median;
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
    while (this.tm < this.finishTime) {
      const minValue = Math.min(this.te1, this.te2, this.ts, this.finishTime);
      switch (minValue) {
        case this.te1:
          if (!this.machineBusy) {
            this.machineBusy = true;
            this.addTe1HandleTimer(minValue);
          } else {
            this.addToQueue('1');
          }
          const te1Time = this.erlangDistribution(3, 0.25); // event timer 1
          this.te1 = minValue + te1Time;
          this.te1Times.push(te1Time);
          break;
        case this.te2:
          if (!this.machineBusy) {
            this.machineBusy = true;
            this.addTe2HandleTimer(minValue);
          } else {
            this.addToQueue('2');
          }
          const te2Time = this.exponentialRandom(2); // event timer 2
          this.te2 = minValue + te2Time;
          this.te2Times.push(this.te2);
          break;
        case this.ts:
          if (this.machineQueue.length === 0) {
            this.ts = this.finishTime + 1;
            this.machineBusy = false;
          } else {
            const eventType = this.removeFromQueue();
            if (eventType === '1') {
              this.addTe1HandleTimer(minValue);
            } else {
              this.addTe2HandleTimer(minValue);
            }
          }
          break;
        case this.finishTime:
          this.addResultRow();
          return;
      }
      this.tm = minValue;
      this.addResultRow();
    }
  }

  public visualizeData(endTime: FormControl, timerSpeed: FormControl) {
    this.finishTime = parseInt(endTime.value, 10);
    this.model();
  }

  public downloadCsv() {
    this.downloadFile(this.te1Times, 'Event 1 times');
    this.downloadFile(this.te2Times, 'Event 2 times');
    this.downloadFile(this.te1HandleTimes, 'Event 1 handle times');
    this.downloadFile(this.te2HandleTimes, 'Event 2 handle times');
  }

  private async downloadFile(data: Array<any>, filename = 'data') {
    const parser = new Parser({ fields: ['sequence', 'time'] });
    const myMap = data.reduce((acc, curr, index) => {
      const newItem = {
        sequence: index,
        time: curr
      };
      acc.push(newItem);
      return acc;
    }, []);
    console.log(myMap);
    const csvData = await parser.parse(myMap);
    console.log(csvData);
    const blob = new Blob(['\ufeff' + csvData], { type: 'text/csv;charset=utf-8;' });
    const dwldLink = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const isSafariBrowser =
      navigator.userAgent.indexOf('Safari') !== -1 && navigator.userAgent.indexOf('Chrome') === -1;
    if (isSafariBrowser) {
      dwldLink.setAttribute('target', '_blank');
    }
    dwldLink.setAttribute('href', url);
    dwldLink.setAttribute('download', filename + '.csv');
    dwldLink.style.visibility = 'hidden';
    document.body.appendChild(dwldLink);
    dwldLink.click();
    document.body.removeChild(dwldLink);
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

  private addTe1HandleTimer(minValue) {
    const te1handleTime = this.normalDistribution(1.5, 14); // handle timer 1
    this.ts = minValue + te1handleTime;
    this.te1HandleTimes.push(te1handleTime);
  }

  private addTe2HandleTimer(minValue) {
    const te2HandleTime = this.exponentialRandom(3); // handle timer 2
    this.ts = minValue + te2HandleTime;
    this.te2HandleTimes.push(te2HandleTime);
  }
}
