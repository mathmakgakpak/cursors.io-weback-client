const fs = require("fs-extra");
const path = require("path");


async function readWholeDir(dir) {
	let tree = {};
	
	for(let file of await fs.readdir(dir)) {
		const a = path.resolve(dir, file);
		try {
			if((await fs.stat(a)).isDirectory()) {
				tree[file] = await readWholeDir(a);
			} else {
				tree[file] = true;
			}
		} catch(e) {
			tree[file] = false; // error
		}
	}
	
	return tree;
}

/*(async () => {
	console.log(await readWholeDir("./"));
})();*/

module.exports = readWholeDir;