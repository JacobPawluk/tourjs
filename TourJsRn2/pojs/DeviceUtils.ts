export const serviceUuids = {
  ftms: '00001826-0000-1000-8000-00805f9b34fb',
  cps: '00001818-0000-1000-8000-00805f9b34fb',
  kickrService: 'a026ee01-0a7d-4ab3-97fa-f1500f9feb8b',
  kickrWriteCharacteristic:   'a026e005-0a7d-4ab3-97fa-f1500f9feb8b',
  hrm: '0000180d-0000-1000-8000-00805f9b34fb',
};


export function getFtms(services:BluetoothRemoteGATTService[]):BluetoothRemoteGATTService|null {
  return services.find((service) => service.uuid === serviceUuids.ftms) || null;
}
export function getHrm(services:BluetoothRemoteGATTService[]):BluetoothRemoteGATTService|null {
  return services.find((service) => service.uuid === serviceUuids.hrm) || null;
}
export function getCps(services:BluetoothRemoteGATTService[]):BluetoothRemoteGATTService|null {
  return services.find((service) => service.uuid === serviceUuids.cps) || null;
}
export function getKickrService(services:BluetoothRemoteGATTService[]):BluetoothRemoteGATTService|null {
  return services.find((service) => service.uuid === serviceUuids.kickrService) || null;
}


export function monitorCharacteristic(
  deviceServer:BluetoothRemoteGATTServer, 
  serviceName:string, 
  characteristicName:string, 
  fnCallback:any  
) {
  return deviceServer.getPrimaryService(serviceName).then((service) => {
    return service.getCharacteristic(characteristicName);
  }).then((characteristic) => {
    return characteristic.startNotifications();
  }).then((characteristic) => {
    characteristic.addEventListener('characteristicvaluechanged', fnCallback);
    return deviceServer;
  })
}

function msPromise(ms:number):Promise<any> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  })
}

let g_writeQueue = Promise.resolve();
let g_cachedFtms:Map<string, BluetoothRemoteGATTCharacteristic> = new Map();

export function deviceUtilsNotifyConnect() {
  g_writeQueue = Promise.resolve();
  g_cachedFtms = new Map();
}

export function writeToCharacteristic(deviceServer:BluetoothRemoteGATTServer, serviceName:string, characteristicName:string, arrayBufferToWrite:DataView):Promise<any> {
  g_writeQueue = g_writeQueue.catch((failure) => {
    // the previous 
    console.log("The previous write-queue operation failed and the caller didn't clean it up >:(", failure);
  }).then(() => {
    if(serviceName === 'fitness_machine') {
      if(g_cachedFtms.has(characteristicName)) {
        const char = g_cachedFtms.get(characteristicName);
        if(char) {
          return char.writeValue(arrayBufferToWrite);
        }
      }
    }


    return deviceServer.getPrimaryService(serviceName).then((service) => {
      return msPromise(100).then(() => {
        return service.getCharacteristic(characteristicName);
      })
    }).then((characteristic) => {
      if(serviceName === 'fitness_machine') {
        g_cachedFtms.set(characteristicName, characteristic);
      }
      return msPromise(100).then(() => {
        return characteristic.writeValue(arrayBufferToWrite);
      })
    })
  });
  return g_writeQueue;
}