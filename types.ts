export enum DeviceType {
  NETWORK = 'Network Infrastructure',
  SERVER = 'Servers & Historians',
  WORKSTATION = 'Workstations (HMI/Eng)',
  CONTROLLER = 'Controllers (PLC/RTU)',
  IOT = 'IIoT / Sensors',
  SECURITY = 'Security Devices'
}

export enum LogSourceType {
  SYSLOG = 'Syslog',
  WINDOWS_EVENT = 'WinEvent',
  NETFLOW = 'NetFlow',
  FLAT_FILE = 'Flat File',
  API = 'API/DB'
}

export interface OTDeviceCategory {
  id: string;
  name: string;
  type: DeviceType;
  logSourceType: LogSourceType;
  count: number;
  baseEpsMultiplier: number; // Average EPS per device
  description: string;
}

export interface CalculationResult {
  totalEps: number;
  dailyLogsGB: number; // Estimated GB per day
  monthlyLogsTB: number; // Estimated TB per month
  breakdown: {
    type: DeviceType;
    eps: number;
    percentage: number;
  }[];
}

export interface AIAnalysis {
  summary: string;
  riskAssessment: string;
  storageStrategy: string;
  keyRecommendations: string[];
}