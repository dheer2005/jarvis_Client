import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, User } from 'src/app/Services/auth.service';
import { JarvisService } from 'src/app/Services/jarvis.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {

  user: User | null = null;
  isConnected = false;
  machineConnected = false;
  machineName = '';
  
  voiceCommand = '';
  volumeLevel = 50;
  brightnessLevel = 50;
  responses: string[] = [];
  latestScreenshot: string | null = null;
  downloadUrl: any = 'https://drive.google.com/file/d/170wR6kvpC5dcSVZxstT_XdlME6cksvc4/view?usp=sharing';

  private subs: Subscription[] = [];
  systemInfo: any = null;

  constructor(
    public jarvis: JarvisService,
    private authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {
    this.user = this.authService.getCurrentUserValue();
    
    // Connect to Jarvis
    await this.jarvis.initConnection();

    // Subscribe to status updates
    this.subs.push(
      this.jarvis.getConnectionStatus().subscribe(s => this.isConnected = s),
      this.jarvis.getMachineStatus().subscribe(m => {
        this.machineConnected = !!m;
        this.machineName = m?.machineName || '';
      }),
      this.jarvis.getCommandResults().subscribe(msg => this.addLog(msg)),
      this.jarvis.getSystemInfo().subscribe(info => {
        this.systemInfo = info;
      }),
      this.jarvis.getScreenshots().subscribe(img => this.latestScreenshot = img)
    );
  }

  loadMachines(){

  }

  getAppIcon(appName: string): string {

    const name = appName.toLowerCase();

    const iconMap: any = {
      "chrome": "assets/icons/chrome.png",
      "google_chrome": "assets/icons/chrome.png",
      "brave": "assets/icons/brave.png",

      "edge": "assets/icons/edge.png",
      "microsoft_edge": "assets/icons/edge.png",

      "notepad": "assets/icons/notepad.png",
      "calculator": "assets/icons/calculator.png",
      "paint": "assets/icons/paint.png",

      "explorer": "assets/icons/file-explorer.png",
      "snipping_tool": "assets/icons/snip-sketch.png",

      "windows_media_player_legacy": "assets/icons/windows-media-player.png",

      "git": "assets/icons/git.png",
      "git_bash": "assets/icons/git.png",
      "git_cmd": "assets/icons/git.png",
      "git_gui": "assets/icons/git.png",

      "vscode": "assets/icons/vscode.png",
      "visual_studio_code": "assets/icons/visual-studio-code.png",
      "visual_studio": "assets/icons/visual-studio.png",
      "visual_studio_2022_ltsc_17_10": "assets/icons/visual-studio.png",
      "blend_for_visual_studio_2022_ltsc_17_10": "assets/icons/visual-studio.png",

      "sql_server_management_studio_21": "assets/icons/sqlserver.png",
      "database_engine_tuning_advisor_21": "assets/icons/sqlserver.png",
      "sql_server_profiler_21": "assets/icons/sqlserver.png",
      "sql_server_2022_error_and_usage_reporting": "assets/icons/sqlserver.png",
      "sql_server_2022_import_and_export_data_(64_bit)": "assets/icons/sqlserver.png",

      "node_js": "assets/icons/nodejs.png",

      "powershell": "assets/icons/powershell.png",
      "windows_powershell_ise_(x86)": "assets/icons/powershell.png",

      "mattermost": "assets/icons/mattermost.png",
      "onedrive": "assets/icons/onedrive.png",
      "spark_desktop": "assets/icons/spark.png",
      "powertoys_(preview)": "assets/icons/powertoys.png",
      "norton_360_for_gamers": "assets/icons/default.png",
      "hubstaff": "assets/icons/hubStaff.png",
      "thunderbird": "assets/icons/thunderbird.png",
      "ultraviewer": "assets/icons/ultraviewer.png",

      "odbc_data_sources_(32_bit)": "assets/icons/odbc.png",

      "youtube": "assets/icons/youtube.png",
      "instagram": "assets/icons/instagram.png",
      "telegram": "assets/icons/telegram.png",
      "facebook": "assets/icons/facebook.png",
      "gmail": "assets/icons/gmail.png",
      "whatsapp_web": "assets/icons/whatsapp.png"
    };

    // fallback
    return iconMap[name] || "assets/icons/default.png";
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
    this.jarvis.disconnect();
  }

  addLog(msg: string) {
    const time = new Date().toLocaleTimeString();
    this.responses.unshift(`[${time}] ${msg}`);
    if (this.responses.length > 20) this.responses.pop();
  }

  async sendCommand() {
    if (!this.voiceCommand.trim()) return;
    this.addLog(`> ${this.voiceCommand}`);
    await this.jarvis.sendCommand(this.voiceCommand);
    this.voiceCommand = '';
  }

  logout() {
    this.jarvis.disconnect();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

}
