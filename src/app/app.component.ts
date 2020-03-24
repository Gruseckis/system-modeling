import { Component } from "@angular/core";
import { ModelSystem } from "./shared/system";
import { FormControl } from '@angular/forms';

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent {
  public showTable = false;
  public timerSpeed = new FormControl(200);
  public endTime = new FormControl(500);
  public modeler = new ModelSystem(200); // TODO: Change to 500

  public showResults() {
    // console.log(this.modeler.machineStatus);
    this.showTable = !this.showTable;
  }

  public onStart() {
    this.modeler.visualizeData(this.endTime,this.timerSpeed);
  }
}
