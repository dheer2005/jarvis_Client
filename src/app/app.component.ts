import { Component } from '@angular/core';
import { JarvisService } from './Services/jarvis.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'jarvis-web-client';
  voiceCommand = '';
  volumeLevel = 50;
  brightnessLevel = 50;
  isConnected = false;
  responses: string[] = [];
  latestScreenshot: string | null = null;
  connectedMachines: any[] = [];

  constructor(public jarvis: JarvisService) {}

  async ngOnInit() {
    // Subscribe to responses
    this.jarvis.getCommandResults().subscribe(msg => {
      this.responses.unshift(msg);
      if (this.responses.length > 10) this.responses.pop();
    });

    this.jarvis.getScreenshots().subscribe(img => {
      this.latestScreenshot = img;
    });

    setInterval(() => {
      this.isConnected = true; 
    }, 1000);

    this.loadMachines();
  }

  async sendVoiceCommand() {
    if (!this.voiceCommand.trim()) return;
    
    await this.jarvis.sendCommand(this.voiceCommand);
    this.responses.unshift(`> ${this.voiceCommand}`);
    this.voiceCommand = '';
  }

  async loadMachines() {
    this.connectedMachines = await this.jarvis.getMyMachines();
  }
}
