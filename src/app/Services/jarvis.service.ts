import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Subject } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class JarvisService {
  private hubConnection!: signalR.HubConnection;
  
  // Observables
  private commandResult$ = new Subject<string>();
  private screenshot$ = new Subject<string>();
  private systemInfo$ = new Subject<any>();
  private connectionStatus$ = new BehaviorSubject<boolean>(false);
  private machineStatus$ = new BehaviorSubject<any>(null);

  private serverUrl = environment.serverUrl;

  constructor(private authService: AuthService) {}

  // Initialize connection - call this after login
  async initConnection(): Promise<void> {
    const token = this.authService.getToken();
    
    if (!token) {
      console.error('No token available, cannot connect');
      return;
    }

    // Build connection with JWT token
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${this.serverUrl}/jarvisHub?access_token=${token}`)
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.setupListeners();
    this.setupConnectionEvents();
    await this.connect();
  }

  // Disconnect - call on logout
  async disconnect(): Promise<void> {
    if (this.hubConnection) {
      try {
        await this.hubConnection.stop();
      } catch (err) {
        console.error('Error disconnecting:', err);
      }
    }
    this.connectionStatus$.next(false);
    this.machineStatus$.next(null);
  }

  private setupConnectionEvents() {
    this.hubConnection.onreconnecting(() => {
      console.log('🔄 Reconnecting to Jarvis...');
      this.connectionStatus$.next(false);
    });

    this.hubConnection.onreconnected(() => {
      console.log('✅ Reconnected to Jarvis!');
      this.connectionStatus$.next(true);
      this.registerAsWebClient();
    });

    this.hubConnection.onclose(() => {
      console.log('❌ Disconnected from Jarvis');
      this.connectionStatus$.next(false);
    });
  }

  private setupListeners() {
    this.hubConnection.on('CommandResult', (message: string) => {
      console.log('📨 Command Result:', message);
      this.commandResult$.next(message);
    });

    this.hubConnection.on('RegisteredAsWeb', () => {
      console.log('🟢 Web client registered successfully.');
    });

    this.hubConnection.on('ScreenshotReceived', (base64: string) => {
      console.log('📷 Screenshot received');
      this.screenshot$.next(`data:image/jpeg;base64,${base64}`);
    });

    this.hubConnection.on('SystemInfo', (info: any) => {
      console.log('ℹ️ System Info:', info);
      this.systemInfo$.next(info);
    });

    this.hubConnection.on('MachineConnected', (data: any) => {
      console.log('🖥️ Machine connected:', data);
      this.machineStatus$.next(data);
    });

    this.hubConnection.on('MachineDisconnected', (machineId: string) => {
      console.log('🖥️ Machine disconnected:', machineId);
      this.machineStatus$.next(null);
    });

    this.hubConnection.on('Error', (error: string) => {
      console.error('❌ Jarvis Error:', error);
      this.commandResult$.next(`❌ Error: ${error}`);
    });
  }

  private async connect() {
    try {
      console.log('Attempting to connect to:', this.serverUrl);
      await this.hubConnection.start();
      console.log('✅ Connected to Jarvis Server!');
      this.connectionStatus$.next(true);
      await this.registerAsWebClient();
    } catch (err: any) {
      console.error('❌ Connection failed:', err);
      console.error('Error details:', err.message);
      this.connectionStatus$.next(false);
      
      // Retry after 5 seconds
      console.log('Retrying in 5 seconds...');
      setTimeout(() => this.connect(), 5000);
    }
  }

  private async registerAsWebClient() {
    try {
      await this.hubConnection.invoke('RegisterWebClient');
      console.log('✅ Registered as web client');
    } catch (err) {
      console.error('Failed to register as web client:', err);
    }
  }

  // ============ Public Observables ============
  getCommandResults() { return this.commandResult$.asObservable(); }
  getScreenshots() { return this.screenshot$.asObservable(); }
  getSystemInfo() { return this.systemInfo$.asObservable(); }
  getConnectionStatus() { return this.connectionStatus$.asObservable(); }
  getMachineStatus() { return this.machineStatus$.asObservable(); }

  // ============ Commands ============
  async sendCommand(command: string): Promise<void> {
    if (this.hubConnection?.state !== signalR.HubConnectionState.Connected) {
      this.commandResult$.next('❌ Not connected to server');
      return;
    }
    try {
      await this.hubConnection.invoke('ProcessCommand', command);
    } catch (err) {
      console.error('Failed to send command:', err);
      this.commandResult$.next('❌ Failed to send command');
    }
  }

  async volumeUp() { await this.sendCommand('volume up'); }
  async volumeDown() { await this.sendCommand('volume down'); }
  async setVolume(level: number) { await this.sendCommand(`set volume to ${level}`); }
  async maximizeWindow() { await this.sendCommand('maximize window'); }
  async minimizeWindow() { await this.sendCommand('minimize window'); }
  async restoreWindow() { await this.sendCommand('restore window'); }
  async setBrightness(level: number) { await this.sendCommand(`set brightness to ${level}`); }
  async openApp(appName: string) { await this.sendCommand(`open ${appName}`); }
  async closeApp(appName: string) { await this.sendCommand(`close ${appName}`); }
  async takeScreenshot() { await this.sendCommand('take screenshot'); }
  async requestSystemInfo() { await this.sendCommand('system info'); }

  async getMyMachines(): Promise<any[]> {
    if (this.hubConnection?.state !== signalR.HubConnectionState.Connected) return [];
    try {
      return await this.hubConnection.invoke('GetMyMachines') || [];
    } catch { return []; }
  }

  isConnected(): boolean {
    return this.hubConnection?.state === signalR.HubConnectionState.Connected;
  }
}