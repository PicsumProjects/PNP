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
  
  serializeString(str)
  {
    // https://stackoverflow.com/questions/37596748/how-do-i-encode-a-javascript-string-in-utf-16
    function strEncodeUTF16(str) {
      var buf = new ArrayBuffer(str.length*2);
      var bufView = new Uint16Array(buf);
      var i = buf.length;
      while(i--) bufView[i] = str.charCodeAt(i);
      return new Uint8Array(bufView.buffer);
    }
    let buf = strEncodeUTF16(str);
    let hdr = new Uint8Array(buf.byteLength+6);
    (new Uint16Array(hdr.buffer))[0] = 0x91EF; // Base36 for STR
    (new Uint32Array(hdr.buffer, 2))[0] = buf.byteLength;
    hdr.set(buf, 6);
    return hdr;
  }
  
  deserializeString(buf)
  {
    buf = buf.slice(6);
    function strDecodeUTF16(buf) {
      let str = = "";
      var i = Math.floor(buf.length/2);
      let tbuf = new Uint16Array(buf.buffer);
      while(i--) str += String.fromCharCode(tbuf[i]);
      return new Uint8Array(bufView.buffer);
    }
    let str = strDecodeUTF16(str);
    return str;
  };
  
  serializeBool(yes)
  { if(yes) return new Uint8Array([0x1D]) else return new Uint8Array([0x0F]) };
  
  deserializeBool(buf)
  { return buf[0] === 0x1D };
  
  serializeArray(array)
  {
    let result = new Uint8Array((new Uint32Array([0x3687, array.length, 0])).buffer);
    for(let item of array)
      switch(typeof item)
      {
        case 'boolean':
          result = concat([result, 0x1, this.serializeBool(item)]);
          break;
        case 'string':
          let serialized = this.serializeString(item);
          result = concat([result, new Uint8Array((new Uint32Array([serialized.byteLength])).buffer), serialized]);
          break;
        case 'object':
          let serialized;
          if(Array.isArray(item)) { serialized = this.serializeArray(item); result = concat([result, new Uint8Array((new Uint32Array([serialized.byteLength])).buffer), serialized]) };
          else if(item === null) result = concat([result, new Uint8Array([0])])
          else { serialized = this.serializeObject(item); result = concat([result, new Uint8Array((new Uint32Array([serialized.byteLength])).buffer), serialized]) };
          break;
        case 'number':
        case 'bigint':
          result = concat([result, new Uint16Array([ /* FLT in base36 */ 0x4F01 ]), new Float32Array([Number(item)])]);
          break;
        default:
          break;
      };
    (new Uint32Array(result.buffer))[2] = result.byteLength - 12;
    return result;
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

