import { PublicAPI } from './global'

export default function Require(module: string) {
	if(module.startsWith("./")) { // dumb
		return require(`./${module.slice(2)}`);
	}/* else if(module.startsWith("../")) {
		return require(`../${module.slice(3)}`);
	}*/ else if(module === "events") { // dumb too
		return require("events");
	}
}

PublicAPI.realRequire = require;
PublicAPI.require = Require;