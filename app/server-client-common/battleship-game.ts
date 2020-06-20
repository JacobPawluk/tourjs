import { assert2 } from "./Utils";


export enum BattleshipGameTurnType {
  MOVE,
  RADAR,
  SHOOT,
  PASS,
}

export enum BattleshipShipType {
  PATROL,
  SUB,
  CRUISER,
  BATTLESHIP,
  CARRIER,
  UNKNOWN,
}

export interface BattleshipGameTurn {
  type:BattleshipGameTurnType;
  params: BattleshipGameParamsMove|BattleshipGameParamsRadar|BattleshipGameParamsShoot;
}
export interface BattleshipGameParamsMove {
  ship:BattleshipShipType;
  ixCols:number; // squares to move the ship
  ixRows:number; // squares to move the ship
  push:boolean; // whether they earned the bonus "push" capability
}
export interface BattleshipGameParamsRadar {
  count:number; // how many radar squares do they get?
  stealth:boolean; // whether they earned the bonus "stealth" capability
}
export interface BattleshipGameParamsShoot {
  ixRow:number;
  ixCol:number;
}

export enum BattleshipGameSquareType {
  EMPTY,
  SHOTBLAST,
};

export class BattleshipGameSquare {
  eType:BattleshipGameSquareType;

  constructor() {
    this.eType = BattleshipGameSquareType.EMPTY;
  }
}


export class BattleshipGameShip {
  shipType:BattleshipShipType;
  ixTopLeftCol: number;
  ixTopLeftRow: number;
  isVertical: boolean;
  damaged:boolean[];
  nGrid:number;
  name:string;

  constructor(
    shipType:BattleshipShipType,
    ixTopLeftCol: number,
    ixTopLeftRow: number,
    isVertical: boolean,
    nGrid: number,
  ) {
    this.shipType = shipType;
    this.ixTopLeftCol = ixTopLeftCol;
    this.ixTopLeftRow = ixTopLeftRow;
    this.isVertical = isVertical;
    this.nGrid = nGrid;
    
    switch(this.shipType) {
      case BattleshipShipType.PATROL: this.name = "Patrol Boat (2)"; break;
      case BattleshipShipType.SUB: this.name = "Sub (3)"; break;
      case BattleshipShipType.CRUISER: this.name = "Cruiser (4)"; break;
      case BattleshipShipType.BATTLESHIP: this.name = "Battleship (5)"; break;
      case BattleshipShipType.CARRIER: this.name = "Carrier (5)"; break;
      case BattleshipShipType.UNKNOWN: this.name = "Unknown"; break;
    }

    this.damaged = [];
    for(var x = 0;x < this.getLength(); x++) {
      this.damaged.push(false);
    }
  }

  isValidPlacement():boolean {
    for(var x = 0;x < this.getLength(); x++) {
      let ixCol;
      let ixRow;
      if(this.isVertical) {
        ixCol = this.ixTopLeftCol;
        ixRow = this.ixTopLeftRow + x;
      } else {
        ixCol = this.ixTopLeftCol + x;
        ixRow = this.ixTopLeftRow;
      }
      if(ixCol < 0 || ixCol >= this.nGrid || ixRow < 0 || ixRow >= this.nGrid) {
        return false;
      }
    }
    return true;
  }

  intersects(b:BattleshipGameShip) {
    for(var x = 0;x < this.getLength(); x++) {
      let ixCol;
      let ixRow;
      if(this.isVertical) {
        ixCol = this.ixTopLeftCol;
        ixRow = this.ixTopLeftRow + x;
      } else {
        ixCol = this.ixTopLeftCol + x;
        ixRow = this.ixTopLeftRow;
      }
      if(b.isShipPresent(ixCol, ixRow)) {
        return true;
      }
    }
    return false;
  }

  isDamagedAt(ixCol:number, ixRow:number) {
    if(!this.isShipPresent(ixCol, ixRow)) {
      return false;
    }
    const offset = this.getOffsetOfSpot(ixCol, ixRow);
    assert2(offset >= 0 && offset < this.damaged.length);
    return this.damaged[offset];
  }

  getLength():number {
    switch(this.shipType) {
      case BattleshipShipType.BATTLESHIP:
        return 5;
      case BattleshipShipType.CARRIER:
        return 5;
      case BattleshipShipType.CRUISER:
        return 4;
      case BattleshipShipType.SUB:
        return 3;
      case BattleshipShipType.PATROL:
        return 2;
      case BattleshipShipType.UNKNOWN:
        return 1;
    }
  }
  getHeight():number {
    if(!this.isVertical) {
      return 1;
    } else {
      return this.getLength();
    }
  }
  getWidth():number {
    if(this.isVertical) {
      return 1;
    } else {
      return this.getLength();
    }
  }

  isShipPresent(ixCol:number, ixRow:number):boolean {
    const len = this.getLength();
    if(this.isVertical) {
      return (ixCol === this.ixTopLeftCol) && (ixRow >= this.ixTopLeftRow) && (ixRow < this.ixTopLeftRow + len);
    } else {
      return (ixRow === this.ixTopLeftRow) && (ixCol >= this.ixTopLeftCol) && (ixCol < this.ixTopLeftCol + len);
    }
  }
  isSunk():boolean {
    return this.damaged.every((damage) => damage);
  }
  applyMove(move:BattleshipGameParamsMove):BattleshipTurnResultMove {
    const ixColStart = this.ixTopLeftCol;
    const ixRowStart = this.ixTopLeftRow;
  
    let ixColNew = Math.max(0, move.ixCols + this.ixTopLeftCol);
    let ixRowNew = Math.max(0, move.ixRows + this.ixTopLeftRow);
    const w = this.getWidth();
    const h = this.getHeight();

    ixColNew = Math.min(this.nGrid - w, ixColNew);
    ixRowNew = Math.min(this.nGrid - h, ixRowNew);

    this.ixTopLeftCol = ixColNew;
    this.ixTopLeftRow = ixRowNew;

    return {
      ixColsMoved: this.ixTopLeftCol - ixColStart,
      ixRowsMoved: this.ixTopLeftRow - ixRowStart,
    }
  }

  getOffsetOfSpot(ixCol:number, ixRow:number):number {
    if(!this.isShipPresent(ixCol, ixRow)) {
      return -1;
    }
    let offset;
    if(this.isVertical) {
      offset = ixRow - this.ixTopLeftRow;
    } else {
      offset = ixCol - this.ixTopLeftCol;
    }
    return offset;
  }

  applyShot(shot:BattleshipGameParamsShoot):BattleshipTurnResultShoot {
    if(!this.isShipPresent(shot.ixCol, shot.ixRow)) {
      return {hit:false, newlysunk:false,sunk:false};
    } else {
      // ok, we definitely got hit
      const len = this.getLength();
      const offset = this.getOffsetOfSpot(shot.ixCol, shot.ixRow);
      assert2(offset >= 0 && offset < len);

      const sunkBefore = this.isSunk();
      this.damaged[offset] = true;

      return {hit: true, sunk: this.isSunk(), newlysunk: this.isSunk() && !sunkBefore};
    }
    
  }
}

export interface BattleshipTurnResultMove {
  ixRowsMoved:number;
  ixColsMoved:number;
}
export interface BattleshipTurnResultShoot {
  hit:boolean;
  sunk:boolean;
  newlysunk:boolean;
}
export interface BattleshipTurnResultRadar {
  ixColScanned:number[];
  ixRowScanned:number[];
  shipPresent:boolean[];
}

export interface BattleshipMapCreate {
  nGrid:number;
  ships:BattleshipGameShip[];
  mapId:string;
  shotHistory?:string[];
  radarHistory?:string[];
}

export interface BattleshipApplyMove {
  mapId: string;
  move: BattleshipGameTurn;
}

export interface BattleshipMapCreateResponse {
  mapId:string;
  create: BattleshipMapCreate;
  waitingPlayers: string[];
}

export class BattleshipGameMap {
  nGrid:number;
  grid:BattleshipGameSquare[][];
  ships:BattleshipGameShip[];

  setRadarHistory:Set<string>;
  setShotHistory:Set<string>;
  mapId:string;

  constructor(mapId:string, nGrid:number, ships:BattleshipGameShip[], shotHistory?:string[]) {
    this.mapId = mapId;
    this.nGrid = nGrid;
    this.grid = [];
    this.ships = ships;
    for(var ixRow = 0;ixRow < this.nGrid; ixRow++) {
      const cols = [];
      for(var ixCol = 0; ixCol < this.nGrid; ixCol++) {
        cols.push(new BattleshipGameSquare());
      }
      this.grid.push(cols);
    }
    this.setShotHistory = new Set<string>();
    if(shotHistory) {
      shotHistory.forEach((shot) => {
        this.setShotHistory.add(shot);
      })
    }

    this.setRadarHistory = new Set<string>();
  }

  getMapId():string {
    return this.mapId;
  }

  toMapCreate():BattleshipMapCreate {
    let shots:string[] = [];
    this.setShotHistory.forEach((shot) => {
      shots.push(shot);
    })
    let radars:string[] = [];
    this.setRadarHistory.forEach((radar) => {
      radars.push(radar);
    })
    return {
      nGrid: this.nGrid,
      ships: this.ships,
      mapId: this.mapId,
      shotHistory: shots,
      radarHistory: radars,
    }
  }

  isShipPresent(ixCol:number, ixRow:number):boolean {
    return !!this.ships.find((ship) => {
      return ship.isShipPresent(ixCol, ixRow);
    })
  }
  getShipAt(ixCol:number, ixRow:number):BattleshipGameShip|undefined {
    return this.ships.find((ship) => {
      return ship.isShipPresent(ixCol, ixRow);
    })
  }

  getRadarAt(ixCol:number, ixRow:number):boolean {
    // has there been radar on this square?
    const key = ixCol + '|' + ixRow;
    return this.setRadarHistory.has(key);
  }
  getShotAt(ixCol:number, ixRow:number):boolean {
    const key = ixCol + '|' + ixRow;
    return this.setShotHistory.has(key);
  }

  applyMove(turn:BattleshipGameTurn):BattleshipTurnResultMove|BattleshipTurnResultShoot|BattleshipTurnResultRadar {
    switch(turn.type) {
      case BattleshipGameTurnType.MOVE:
        // they want to move a ship
        const turnParams = <BattleshipGameParamsMove>turn.params;
        const ship = this.ships.find((shipInList) => shipInList.shipType === turnParams.ship);
        if(ship) {
          return ship.applyMove(turnParams);
        } else {
          assert2(false, "You specced a ship that didn't exist?");
          return {ixRowsMoved:0, ixColsMoved: 0};
        }
        break;
      case BattleshipGameTurnType.RADAR:
        const radarParams = <BattleshipGameParamsRadar>turn.params;

        let result:BattleshipTurnResultRadar = {
          ixColScanned:[],
          ixRowScanned:[],
          shipPresent:[],
        }
        for(var x = 0;x < radarParams.count; x++) {
          const ixCol = Math.floor(Math.random() * this.nGrid);
          const ixRow = Math.floor(Math.random() * this.nGrid);

          result.ixColScanned.push(ixCol);
          result.ixRowScanned.push(ixRow);
          result.shipPresent.push(this.isShipPresent(ixCol, ixRow));

          const key = ixCol + "|" + ixRow;
          this.setRadarHistory.add(key);
        }

        return result;
      case BattleshipGameTurnType.SHOOT:
        const shootParams = <BattleshipGameParamsShoot>turn.params;

        const key = shootParams.ixCol + "|" + shootParams.ixRow;
        this.setShotHistory.add(key);

        let ret;
        this.ships.forEach((ship) => {
          if(ship.isShipPresent(shootParams.ixCol, shootParams.ixRow)) {
            ret = ship.applyShot(shootParams);
          }
        })
        if(ret) {
          return ret;
        } else {
          return {hit: false, sunk: false, newlysunk: false};
        }
      default:
        throw new Error("Unrecognized move type");
    }
  }
}
