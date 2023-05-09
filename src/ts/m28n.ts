// should work
// whyyyyyyyyyyy did i do this

let BASE_URL = "https://api.n.m28.io";
const isSecure = window.location.protocol === "http:";
const protocol = (isSecure ? "wss:" : "ws:");

interface Options {
    version?: string | number; // i don't know exactly
    points?: number;
    timeout?: number;
}
interface Info {
    id: string;
    ipv4: string;
    ipv6: string
}

export function findServers(endpoint: string, options: Options = {}) {
    /*if (typeof options == 'function') {
        callback = options;
        options = {};
    } else {
        // @ts-ignore
        callback = options || {}; // what the fuck exactly
    }*/
    const version = options.version;
    let a = get(BASE_URL + "/endpoint/" + endpoint + "/findEach/" + (version ? `?version=${version}` : ""));
    // console.log(a)
    return a;
}

export function infoToIP(info: Info) {
    const host = isSecure ? (info.id + ".s.m28n.net") : (info.ipv4 || ("[" + info.ipv6 + "]"));
    return protocol + "//" + host + ":2828";
}

export function findRegionPreference(regions: string[], options: Options = {}): Promise<any> { // i don't really know if it works
    return new Promise(async (resolve, reject) => {
        options.points = options.points || 10;
        if (typeof options.timeout === "undefined") options.timeout = isSecure ? 7000 : 5000;
        
        const r = await findServers("latency");
        let points: any = {};
        let wss: WebSocket[] = [];
        for (let region in r.servers) {
            if (!regions.includes(region)) continue;

            let info = r.servers[region];
            
            let ws = new WebSocket(infoToIP(info));
            ws.binaryType = 'arraybuffer';

            ws.onopen = () => {ws.send(new Uint8Array([0x00]).buffer)};

            ws.onmessage = message => {
                let u8 = new Uint8Array(message.data);
                if (u8[0] == 0x00) { // basically this is 0
                    points[region] = (points[region] || 0) + 1;

                    // @ts-ignore
                    if (points[region] >= options.points) return done();
                    ws.send(message.data);
                }
            }

            ws.onerror = err => {console.warn(err)};

            ws.onerror = ws.onclose = function () {
                const i = wss.indexOf(ws);
                if (i !== -1) {
                    wss.splice(i, 1);
                    if (wss.length == 0) {
                        done();
                    }
                }
            }
            wss.push(ws);
        }

        if (wss.length == 0) return reject("No latency servers in selected regions");
        
        let timeout: number;
        let done = function () {
            done = function () {};
            clearTimeout(timeout);
            for (let i = 0; i < wss.length; ++i) {
                try {
                    /*let ws = wss[i];
                    ws.onopen = null;
                    ws.onmessage = null;
                    ws.onerror = null;
                    ws.onclose = null;*/ // why
                    wss[i].close();
                } catch (e) {}
            }
            let arr = [];
            for (let region in points) arr.push({
                region: region,
                points: points[region]
            });
            
            arr.sort((a, b) => b.points - a.points);

            let regions = arr.map(obj => obj.region);

            if (regions.length == 0) {
                throw new Error("Latency testing failed, no servers replied to probes in time");
            }
            // console.log(regions)
            resolve(regions);
        };
        timeout = window.setTimeout(done, options.timeout);
    });
}

export async function findServerPreference(endpoint: string, options: Options = {}) {
    const r = await findServers(endpoint, options);
    if (!r) throw new Error("Unknown error");
    if (!r.servers) throw new Error("Invalid response");

    const availableRegions = [];
    for (let region in r.servers) availableRegions.push(region);

    if (availableRegions.length == 0) throw new Error("Couldn't find any servers in any region");

    if (availableRegions.length == 1) {
        // if you ask "wtf why" look down
        for (let region in r.servers) return [r.servers[region]];
    }

    const regionList = await findRegionPreference(availableRegions, options);

    let a = regionList.map((region: any) => r.servers[region]);
    // console.log(availableRegions, regionList, a);
    return a // servers
}

export function findServerByID(id: string) {
    if (typeof id !== "string") throw new Error("ID must be a string");
    if (!/^[0-9a-zA-Z]+$/.test(id)) {
        return "Invalid server ID";
    }
    let a = get(`${BASE_URL}/server/${id}`);
    // console.log(a);
    return a;
}

function get(url: string) {
    return ajax(url, "GET");
}

/*function post(url: string, body: object) { // not used
    return ajax(url, "POST", typeof body == 'string' ? body : JSON.stringify(body));
}*/

function ajax(url: string, method: string, body?: string): Promise<any> { // :drr:
    return new Promise((resolve, reject) => {
        const r = new XMLHttpRequest();
        r.open(method, url, true);
        r.onerror = reject;
        r.onreadystatechange = function () {
            if (r.readyState != 4) return;
            let obj;
            try {
                obj = JSON.parse(r.responseText);
            } catch (e) {
                // @ts-ignore
                return reject("Failed to parse body. Error: \"" + (e.message || e).toString() + "\". Content: " + r.responseText);
            }
            if (r.status >= 200 && r.status <= 299 && !obj.error) {
                resolve(obj);
            } else {
                reject(obj.error || "Non 2xx status code");
            }
        };
        r.send(body);
    });
}
