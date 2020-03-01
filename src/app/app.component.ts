import { Component } from "@angular/core";
import { ModelSystem } from "./shared/system";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent {
  private modeler = new ModelSystem(500);

  public onButtonClick() {
    this.modeler.model();
  }
}
