/* @preserve
   Utils
*/

// https://stackoverflow.com/a/62414917
const concatu8a = (arrays) => {
  const flatNumberArray = arrays.reduce((acc, curr) => {
    acc.push(...curr);
    return acc;
  }, []);

  return new Uint8Array(flatNumberArray);
};

// https://stackoverflow.com/a/40031979
function buf2hex(buffer) {
  return [...new Uint8Array(buffer)]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('');
}

class PNPSocket {
  #key = window.crypto.getRandomValues(12);
  #isaac = null;
  #sendQueue = [];
  #latency = 10;
  onmessage = null;
  url = null;
  state = 0;
  
  constructor(url, latency = 20) {
    this.url = url;
    this.#isaac = new ISAAC(this.#key);
    setTimeout(this.handle.bind(this), this.#latency = (latency >>> 0));
  };
  
  send(data)
  {
    this.#sendQueue.push([new URL(`./?msg=send&key=${buf2hex(this.#key)}&otherkey=${(2147483647 + this.#isaac.RandSignedInt()).toString(16)}`, this.url).href, new Uint8Array(data)]);
  };
   
  async #start()
  {
     let data = await fetch(new URL(`./?msg=connect&key=${buf2hex(this.#key)}`, this.url).href);
     if(!data.ok)
        throw new Error('Failed to connect to server error ');
     this.state = 1;
  };
  
  async handle()
  {
    if(this.state === 0)
      await this.#start();
    let data = (await fetch(new URL(`./?msg=get&key=${buf2hex(this.#key)}&otherkey=${(2147483647 + this.#isaac.RandSignedInt()).toString(16)}`, this.url).href));
    if(!data.ok && !(data.statusCode === 404)) throw new Error('PNP packet send response error');
    if(typeof this.onmessage === "function") this.onmessage(await data.arrayBuffer());
    let u8a = new Uint8Array(0);
    for(const sendMsg of this.#sendQueue)
      u8a = concatu8a([u8a, sendMsg[1]]);
    let sentData = await fetch(sendMsg, { body: u8a });
    if(!sentData.ok) throw new Error('PNP packet get response error');
    setTimeout(this.handle.bind(this), this.#latency);
  };
};
