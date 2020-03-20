import Controller from '@ember/controller';
import { UserSetupParameters } from 'bt-web2/components/user-set-up-widget/component';
import Ember from 'ember';
import Devices from 'bt-web2/services/devices';

export default class UserSetUp extends Controller.extend({
  // anything which *must* be merged to prototype here
  devices: <Devices><unknown>Ember.inject.service(),

  actions: {
    onAddedUser(user:UserSetupParameters) {
      this.devices.addUser(user);
      this.transitionToRoute('set-up-ride');
    }
  }
}) {
  // normal class body definition here
}

// DO NOT DELETE: this is how TypeScript knows how to look up your controllers.
declare module '@ember/controller' {
  interface Registry {
    'user-set-up': UserSetUp;
  }
}
