import Component from '@ember/component';
import Ember from 'ember';
import { BattleshipGameMap, BattleshipShipType } from 'bt-web2/server-client-common/battleship-game';
import { assert2 } from 'bt-web2/server-client-common/Utils';
import { SelectableActionMode, SelectableAction, applyEffortLevels, MIN_TSS_FOR_TURNPARAMS, MAX_TSS_FOR_TURNPARAMS } from '../battleship-move-selector-bike/component';
import { computed } from '@ember/object';

const cSteps = 2;
export default class BattleshipMoveSelectorBikeMove extends Component.extend({
  // anything which *must* be merged to prototype here

  ship: <BattleshipShipType><unknown>null,
  game: <BattleshipGameMap><unknown>null,
  isNW: null,
  msTempo: 0, // how many milliseconds do we get for the whole cycle?
  tmNextEvaluation: 0,
  msTempoDefault: 0,
  onSelectMove: <(ship:BattleshipShipType, ixCols:number,ixRows:number)=>void><unknown>null,

  actions: {
    onSelectShip(selection:SelectableAction) {
      if(selection.assign.ship) {
        this.set('ship', selection.assign.ship);
        const msPerStep = this.get('msTempo') / cSteps;
        this.set('tmNextEvaluation', new Date().getTime() + msPerStep);
      } else {
        // misfire
        this.onSelectMove(BattleshipShipType.UNKNOWN, 0, 0);
      }
    },
    onSelectMove(selection:SelectableAction) {
      this.onSelectMove(this.get('ship'), selection.assign.ixCols, selection.assign.ixRows);
    }
  }

}) {
  // normal class body definition here
  didInsertElement() {
    assert2(this.get('game'));
    assert2(this.get('isNW') !== null);
    assert2(this.get('msTempo') !== null);

    const msPerStep = this.get('msTempo') / cSteps;

    this.set('tmNextEvaluation', new Date().getTime() + msPerStep);
  }


  @computed('isNW', 'ship', 'msTempo')
  get moveActions():SelectableAction[] {
    const isNW = this.get('isNW');
    const isShipPicked = this.get('ship') !== null;

    const cSteps = 2;
    const msPerStep = this.get('msTempoDefault') / cSteps;
    const secondsPerStep = msPerStep / 1000;

    const tssPerSecondAtFtp = 100 / 3600;
    const tssPerPercentFtp = secondsPerStep*tssPerSecondAtFtp / 100;
    
    let ret = [];
    if(!isShipPicked) {

      const availableShips = this.get('game').ships.filter((ship) => !ship.isSunk());

      let minFtp = 100;
      const shipActions = availableShips.map((ship) => {
        minFtp += 10;
        return {
          assign: {ship:ship.shipType},
          words: ship.name,
          mode: SelectableActionMode.TotalTss,
          minValue: (minFtp - 10)*tssPerPercentFtp,
          maxValue: minFtp*tssPerPercentFtp,
          cls: ship.name.toLowerCase().split(/\s/)[0],
        }
      })

      ret = [{
          assign: {misfire:true},
          words: "Misfire",
          mode: SelectableActionMode.TotalTss,
          minValue: 0,
          maxValue: tssPerPercentFtp*100,
          cls: 'mis-fire',
        }, 
        ...shipActions
      ];

    } else if(isNW) {
      ret = [{
        assign: {ixCols: -1, ixRows: 1},
        words: "SW",
        mode: SelectableActionMode.TotalTss,
        minValue: 0,
        maxValue: tssPerPercentFtp*100,
        cls: 'southwest',
      }, {
        assign: {ixCols: -1, ixRows: 0},
        words: "W",
        mode: SelectableActionMode.TotalTss,
        minValue: tssPerPercentFtp*100,
        maxValue: tssPerPercentFtp*107,
        cls: 'west',
      }, {
        assign: {ixCols: -1, ixRows: -1},
        words: "NW",
        mode: SelectableActionMode.TotalTss,
        minValue: tssPerPercentFtp*107,
        maxValue: tssPerPercentFtp*114,
        cls: 'northwest',
      }, {
        assign: {ixCols: 0, ixRows: -1},
        words: "N",
        mode: SelectableActionMode.TotalTss,
        minValue: tssPerPercentFtp*114,
        maxValue: tssPerPercentFtp*121,
        cls: 'north',
      }, {
        assign: {ixCols: 1, ixRows: -1},
        words: "NE",
        mode: SelectableActionMode.TotalTss,
        minValue: tssPerPercentFtp*121,
        maxValue: tssPerPercentFtp*128,
        cls: 'northeast',
      }]
    } else {
      ret = [{
        assign: {ixCols: -1, ixRows: 1},
        words: "SW",
        mode: SelectableActionMode.TotalTss,
        minValue: 0,
        maxValue: tssPerPercentFtp*100,
        cls: 'southwest',
      }, {
        assign: {ixCols: 0, ixRows: 1},
        words: "S",
        mode: SelectableActionMode.TotalTss,
        minValue: tssPerPercentFtp*100,
        maxValue: tssPerPercentFtp*107,
        cls: 'south',
      }, {
        assign: {ixCols: 1, ixRows: 1},
        words: "SE",
        mode: SelectableActionMode.TotalTss,
        minValue: tssPerPercentFtp*107,
        maxValue: tssPerPercentFtp*114,
        cls: 'southeast',
      }, {
        assign: {ixCols: 1, ixRows: 0},
        words: "E",
        mode: SelectableActionMode.TotalTss,
        minValue: tssPerPercentFtp*114,
        maxValue: tssPerPercentFtp*121,
        cls: 'east',
      }, {
        assign: {ixCols: 1, ixRows: -1},
        words: "NE",
        mode: SelectableActionMode.TotalTss,
        minValue: tssPerPercentFtp*121,
        maxValue: tssPerPercentFtp*128,
        cls: 'northeast',
      }]
    }

    applyEffortLevels(ret, tssPerPercentFtp*MIN_TSS_FOR_TURNPARAMS, tssPerPercentFtp*MAX_TSS_FOR_TURNPARAMS);

    return ret;
  }
};
