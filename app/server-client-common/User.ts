import { CadenceRecipient, PowerRecipient, HrmRecipient } from "../pojs/WebBluetoothDevice";
import { RideMap } from "./RideMap";
import { assert2 } from "./Utils";

export enum UserTypeFlags {
  Local = 1,
  Remote = 2,
  Ai = 4,
}

export interface UserDisplay {
  name: string;
  lastPower: string;
  distance: string;
  speed: string;
}

class UserDataRecorder implements CadenceRecipient, PowerRecipient, HrmRecipient {
  private _lastPower:number = 0;
  private _id:number = -1; // assigned by the server.  Positive when set

  public notifyPower(tmNow:number, watts:number):void {
    this._lastPower = watts;
  }
  public notifyCadence(tmNow:number, cadence:number):void {

  }
  public notifyHrm(tmNow:number, hrm:number):void {

  }

  public getLastPower():number {
    return this._lastPower;
  }

  setId(newId:number) {
    assert2(this._id < 0 || newId === this._id, "we should only be assigning IDs once...");
    this._id = newId;
  }
  getId() {
    return this._id;
  }
}

export class User extends UserDataRecorder {

  private _massKg: number;
  private _handicap: number;
  private _typeFlags:number;
  private _name:string;

  private _lastT:number = 0;
  private _speed:number = 0;
  private _position:number = 0;
  
  
  constructor(name:string, massKg:number, handicap:number, typeFlags:number) {
    super();
    this._massKg = massKg;
    this._handicap = handicap;
    this._typeFlags = typeFlags;
    this._name = name;
    this._lastT = new Date().getTime() / 1000.0;
  }

  getUserType():number {
    return this._typeFlags;
  }

  getHandicap() {
    return this._handicap;
  }


  physicsTick(tmNow:number, map:RideMap, otherUsers:User[]) {
    const t = tmNow / 1000.0;
    const dtSeconds = t - this._lastT;
    this._lastT = t;
    if(dtSeconds < 0 || dtSeconds >= 1.0) {
      return;
    }

    // apply handicapping or other wackiness that the map might be applying
    const fnTransformPower = map.getPowerTransform(this);
    const transformedPower:number = fnTransformPower(this.getLastPower());


    const powerForce = transformedPower / Math.max(this._speed, 0.5);

    const rho = 1.225;
    const cda = 0.25;
    const aeroForce = -Math.pow(this._speed, 2) * 0.5 * rho * cda;

    const slope = map.getSlopeAtDistance(this._position);
    const theta = Math.atan(slope);

    const sinSquared = Math.sin(theta)*Math.sin(theta);
    const cosSquared = Math.pow(Math.cos(theta)-1,2);
    let slopeForce = Math.sqrt(sinSquared+cosSquared);
    if(slope < 0) {
      assert2(slopeForce >= 0);
      slopeForce = -slopeForce;
    }
    
    const rollingForce = -0.0033 * this._massKg * 9.81;

    assert2(rollingForce <= 0);
    assert2(aeroForce <= 0);
    
    const totalForce = powerForce + aeroForce + slopeForce + rollingForce;
    const accel = totalForce / this._massKg;
    this._speed += accel * dtSeconds;
    console.log("accel = ", accel, " speed = ", this._speed, " forces = ", this._massKg, totalForce, powerForce, aeroForce, rollingForce, dtSeconds);
    assert2(this._speed >= 0);
    this._position += this._speed * dtSeconds;
  }

  getDisplay():UserDisplay {
    return {
      name: this._name,
      lastPower: this.getLastPower().toFixed(0) + 'W',
      distance: this._position.toFixed(0) + 'm',
      speed: (this._speed*3.6).toFixed(1) + 'km/h',
    }
  }
}