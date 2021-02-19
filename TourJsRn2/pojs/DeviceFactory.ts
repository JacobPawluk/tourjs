import { ConnectedDeviceInterface, BTDeviceState, PowerDataDistributor, CadenceRecipient, HrmRecipient, BluetoothFtmsDevice, BluetoothCpsDevice, BluetoothKickrDevice, BluetoothDeviceShared } from "./WebBluetoothDevice";
import { getFtms, monitorCharacteristic, writeToCharacteristic, getCps, getKickrService, serviceUuids, deviceUtilsNotifyConnect, getHrm } from "./DeviceUtils";

export interface DeviceFactory {
    findPowermeter(byPlugin?:boolean):Promise<ConnectedDeviceInterface>;
    findHrm():Promise<ConnectedDeviceInterface>;
}

export class TestPowermeter extends PowerDataDistributor {
    _interval:any = null;

    constructor() {
        super();
        this._interval = setInterval(() => {
            const tmNow = new Date().getTime();
            this._notifyNewPower(tmNow, Math.random() * 50 + 200);
        }, 500);
    }

    getDeviceTypeDescription():string {
      return "Fake Device";
    }
    disconnect(): Promise<void> {
        clearInterval(this._interval);
        this._interval = null;
        return Promise.resolve();
    }
    getState(): BTDeviceState {
        return BTDeviceState.Ok;
    }
    name(): string {
        return "Test Powermeter";
    }
    hasPower(): boolean {
        return true;
    }
    hasCadence(): boolean {
        return false;
    }
    hasHrm(): boolean {
        return false;
    }
    updateSlope(tmNow:number, ftmsPct:number): Promise<boolean> {
      return Promise.resolve(false);
    }
    updateErg(tmNow: number, watts:number): Promise<boolean> {
      return Promise.resolve(false);
    }
    getDeviceId(): string {
      throw new Error("Method not implemented.");
    }
    updateResistance(tmNow: number, pct: number): Promise<boolean> {
      throw new Error("Method not implemented.");
    }
}

class BluetoothHrmDevice extends BluetoothDeviceShared {

  constructor(gattDevice:BluetoothRemoteGATTServer) {
    super(gattDevice);
    
    this._startupPromise = this._startupPromise.then(() => {
      // need to start up property monitoring for ftms

      const fnHrmData = (evt:any) => { this._decodeHrmData(evt.target.value)};
      return monitorCharacteristic(gattDevice, 'heart_rate', 'heart_rate_measurement', fnHrmData);
    })
  }
  _decodeHrmData(dataView:DataView) {
    const tmNow = new Date().getTime();
    const flags = dataView.getUint8(0);
    let hr = 0;
    if((flags & 1) === 0) {
      // this is a uint8 hrm
      hr = dataView.getUint8(1);
    } else {
      // this is a uint16 hrm
      hr = dataView.getUint16(1, true);
    }

    console.log("hrm = ", hr, " bpm");
    this._notifyNewHrm(tmNow, hr);
  }


  public hasPower(): boolean { return false;}
  public hasCadence(): boolean { return false;}
  public hasHrm(): boolean {return true;}
  
  public getDeviceTypeDescription():string {
    return "Bluetooth HRM";
  }

  public updateErg(tmNow: number, watts:number): Promise<boolean> {
    return Promise.resolve(false);
  }
  public updateSlope(tmNow:number, ftmsPct:number):Promise<boolean> {
    return Promise.resolve(false);
  }
  public updateResistance(tmNow:number, pct:number):Promise<boolean> {
    return Promise.resolve(false);
  }
}

class TestDeviceFactory implements DeviceFactory {
    findPowermeter(byPlugin?:boolean):Promise<ConnectedDeviceInterface>{

      const filters = {
        filters: [
          {services: ['cycling_power']},
          {services: ['fitness_machine', 'cycling_power']},
          {services: [serviceUuids.kickrService, 'cycling_power']},
        ]
      }
      return navigator.bluetooth.requestDevice(filters).then((device) => {
        if(device.gatt) {
          return device.gatt.connect();
        } else {
          throw new Error("No device gatt?");
        }
      }).then((gattServer) => {
        deviceUtilsNotifyConnect();
        return gattServer.getPrimaryServices().then((services) => {
          const ftms = getFtms(services);
          const cps = getCps(services);
          const kickr = getKickrService(services);

          if(ftms) {
            return new BluetoothFtmsDevice(gattServer);
          } else if(kickr) {
            return new BluetoothKickrDevice(gattServer);
          } else if(cps) {
            return new BluetoothCpsDevice(gattServer);
          } else {
            throw new Error("We don't recognize what kind of device this is");
          }
        })
      });
    }
    findHrm(): Promise<ConnectedDeviceInterface> {
      const filters = {
        filters: [
          {services: ['heart_rate']},
        ]
      }
      return navigator.bluetooth.requestDevice(filters).then((device) => {
        if(device.gatt) {
          return device.gatt.connect();
        } else {
          throw new Error("No device gatt?");
        }
      }).then((gattServer) => {
        deviceUtilsNotifyConnect();
        return gattServer.getPrimaryServices().then((services) => {
          const hrm = getHrm(services);

          if(hrm) {
            return new BluetoothHrmDevice(gattServer);
          } else {
            throw new Error("We don't recognize what kind of device this is");
          }
        })
      });
    }
}

const g_deviceFactory:DeviceFactory = new TestDeviceFactory();
export function getDeviceFactory():DeviceFactory {
    return g_deviceFactory;
}