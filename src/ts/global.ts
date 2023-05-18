import EventEmitter from 'events';
import browserRequire from './browserRequire';

declare global {
  var C: any;
  var Cursors: any;
}

export const PublicAPI = window.C = window.Cursors = <any>{};
export const eventSys = new EventEmitter();

PublicAPI.emit = eventSys.emit.bind(eventSys);
PublicAPI.on = eventSys.on.bind(eventSys);
PublicAPI.once = eventSys.once.bind(eventSys);
PublicAPI.removeListener = PublicAPI.off = eventSys.removeListener.bind(eventSys);

PublicAPI.require = browserRequire;

PublicAPI.buildNumber = process.env.BUILD_NUMBER;

PublicAPI.version = process.env.VERSION;
PublicAPI.productionBuild = process.env.PRODUCTION_BUILD;