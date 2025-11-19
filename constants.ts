import { DeviceType, OTDeviceCategory, LogSourceType } from './types';

// Helper for dynamic estimation based on Device Type + Log Source
export const getRecommendedEps = (type: DeviceType, source: LogSourceType): number => {
  switch (source) {
    case LogSourceType.NETFLOW:
      return 200; // Very high volume per source
    case LogSourceType.WINDOWS_EVENT:
      if (type === DeviceType.SERVER) return 15;
      if (type === DeviceType.WORKSTATION) return 3;
      return 5;
    case LogSourceType.SYSLOG:
      if (type === DeviceType.SECURITY) return 50; // Firewalls are chatty
      if (type === DeviceType.NETWORK) return 2;
      if (type === DeviceType.CONTROLLER) return 0.5;
      return 1;
    case LogSourceType.API:
      return 5;
    case LogSourceType.FLAT_FILE:
      return 2;
    default:
      return 1;
  }
};

// EPS multipliers are estimates based on typical OT environments.
// Firewalls are chatty, PLCs are usually quiet unless DPI is enabled.
export const DEFAULT_DEVICE_CATEGORIES: OTDeviceCategory[] = [
  {
    id: 'fw',
    name: 'Firewalls / IDPS',
    type: DeviceType.SECURITY,
    logSourceType: LogSourceType.SYSLOG,
    count: 2,
    baseEpsMultiplier: 50, // High volume logs
    description: 'OT/IT Boundary & Zone Firewalls'
  },
  {
    id: 'switch',
    name: 'Managed Switches',
    type: DeviceType.NETWORK,
    logSourceType: LogSourceType.SYSLOG,
    count: 10,
    baseEpsMultiplier: 2, 
    description: 'Core and Access Switches'
  },
  {
    id: 'historian',
    name: 'Historian Servers',
    type: DeviceType.SERVER,
    logSourceType: LogSourceType.WINDOWS_EVENT,
    count: 1,
    baseEpsMultiplier: 15, // Windows Event Logs + App logs
    description: 'Process Data Historians'
  },
  {
    id: 'opc',
    name: 'OPC Servers',
    type: DeviceType.SERVER,
    logSourceType: LogSourceType.API,
    count: 1,
    baseEpsMultiplier: 10,
    description: 'Connectivity Servers'
  },
  {
    id: 'hmi',
    name: 'HMI Clients',
    type: DeviceType.WORKSTATION,
    logSourceType: LogSourceType.WINDOWS_EVENT,
    count: 5,
    baseEpsMultiplier: 3,
    description: 'Operator Stations'
  },
  {
    id: 'eng',
    name: 'Eng. Workstations',
    type: DeviceType.WORKSTATION,
    logSourceType: LogSourceType.WINDOWS_EVENT,
    count: 2,
    baseEpsMultiplier: 5, // Slightly higher due to changes/access
    description: 'Maintenance Laptops/Stations'
  },
  {
    id: 'plc',
    name: 'PLCs / RTUs',
    type: DeviceType.CONTROLLER,
    logSourceType: LogSourceType.SYSLOG,
    count: 20,
    baseEpsMultiplier: 0.5, // Syslog usually, low volume
    description: 'Programmable Logic Controllers'
  },
  {
    id: 'ied',
    name: 'IEDs / Relays',
    type: DeviceType.CONTROLLER,
    logSourceType: LogSourceType.SYSLOG,
    count: 0,
    baseEpsMultiplier: 0.2,
    description: 'Intelligent Electronic Devices'
  }
];

export const BYTES_PER_LOG = 650; // Average log size in bytes for storage calc