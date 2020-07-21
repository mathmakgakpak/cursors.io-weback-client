import EventEmitter from 'events';

export const PublicAPI = (<any>window).C = (<any>window).Cursors = <any>{};
export const eventSys = new EventEmitter.EventEmitter();

PublicAPI.emit = eventSys.emit.bind(eventSys);
PublicAPI.on = eventSys.on.bind(eventSys);
PublicAPI.once = eventSys.once.bind(eventSys);
PublicAPI.removeListener = PublicAPI.off = eventSys.removeListener.bind(eventSys);