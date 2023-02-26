// https://stackoverflow.com/questions/49129643/how-do-i-merge-an-array-of-uint8arrays
function concat(arrays) {
  // sum of individual array lengths
  let totalLength = arrays.reduce((acc, value) => acc + value.length, 0);

  if (!arrays.length) return null;

   let result = new Uint8Array(totalLength);

      // for each array - copy it over result
      // next array is copied right after the previous one
      let length = 0;
      for(let array of arrays) {
            result.set(array, length);
            length += array.length;
      }

      return result;
   }

class Socket
{
  ws = null;
  // Helper with evt2async
  #requestCanary = 0;
  #msgHandlerOn = false;
  #currentData = new Uint8Array(0);
  
  constructor(url)
  {
    this.ws = new WebSocket(url);
  };
  
  sendAndWait(data)
  {
    if(data.constructor !== Uint8Array) throw new TypeError('data must be a Uint8Array');
    let oldRequestCanary = this.#requestCanary;
    if(!this.#msgHandlerOn)
    {
      this.ws.addEventListener("message", this.onMessage.bind(this));
      this.#msgHandlerOn = true;
    };
    let hdr = new Uint8Array(6);
    (new Uint16Array(hdr.buffer))[0] = 33253; // PNP in base36
    (new Uint32Array(hdr.buffer, 2))[0] = data.byteLength;
    let newData = new Uint8Array(6 + data.byteLength);
    newData.set(hdr);
    newData.set(data, 6);
    this.ws.send(newData);
    while(oldRequestCanary !== this.requestCanary)
      await new Promise((resolve, ..._) => setTimeout(resolve, 50));
    return this.#currentData;
  };
  
  onMessage(ev)
  {
    this.#currentData = ev.data;
    this.#requestCanary++;
  };
};

if(window["require"]) module.exports = Socket;

