let ISAAC = require("./isaac");

class PNPServer {
  #handler = null;
  #sendQueue = [];
  onconnect = null;
  ondisconnect = null;
  onmessage = null;
  
  constructor(express, path)
  {
     this.#handler = setSocketListener(express, path, this.handlerUp.bind(this), this.handlerDown.bind(this));
  };
  
  send(u8a, clientData)
  {
    this.#sendQueue.push(['send'], new Uint8Array(u8a), Array.prototype.slice.call(clientData));
  };
  
  handlerDown(req, res)
  {
    let u8a = new Uint8Array(0);
    let i = 0;
    for(const data of this.#queue)
    {
      if(data[2] !== [res.query.key, res.query.otherkey]) continue;
      if((data[0] === 'close') && (i === 0))
      {
        res.status(404).send({ message: '' });
        delete this.#handler[0][req.query.key];
        return;
      } else if(res[0] === 'close') {
        res.send(u8a);
        this.#queue = this.#queue.slice(i);
        return;
      };
      u8a = concatu8a([u8a, data[1]]);
      i++;
    };
  };
    
    handlerUp(req, res) 
    {
      if(typeof this.#onmessage === "function") this.#onmessage(req.body, req.query.key);
    };
};

module.exports = PNPServer;

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

// https://stackoverflow.com/a/69585881
const MAP_HEX = {
  0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6,
  7: 7, 8: 8, 9: 9, a: 10, b: 11, c: 12, d: 13,
  e: 14, f: 15, A: 10, B: 11, C: 12, D: 13,
  E: 14, F: 15
};
function fromHex(hexString) {
  const bytes = new Uint8Array(Math.floor((hexString || "").length / 2));
  let i;
  for (i = 0; i < bytes.length; i++) {
    const a = MAP_HEX[hexString[i >> 1]];
    const b = MAP_HEX[hexString[(i >> 1) + 1]];
    if (a === undefined || b === undefined) {
      break;
    }
    bytes[i] = (a << 4) | b;
  }
  return i === bytes.length ? bytes : bytes.slice(0, i);
}

function setSocketListener(expressApp, path, handlerUp, handlerDown) {
    let connections = {};
    expressApp.use(expressApp.raw());
    let reciever = expressApp.get(path, function (req, res) {
        let msgType = req.query.msg;
        switch(msgType) {
            case "connect":
               let key = req.query.key;
               // Test for invalid handshakes
               if((key.length != 24) || (!key.test(/[0-9A-Fa-f]{6}/g) || (key in Object.keys(connections))) res.status(400).send({ message: '' }); 
               connections[key] = [new ISAAC(fromHex(key))];
               break;
            case "send":
               let key = req.query.key;
               let isaacData = req.query.otherkey;
               if((key.length != 24) || (!key.test(/[0-9A-Fa-f]{6}/g)) res.status(400).send({ message: '' });
               if((isaacData.length != 8) || (!isaacData.test(/[0-9A-Fa-f]{6}/g)) res.status(400).send({ message: '' });
               let key_u8a = fromHex(key);
               if(!(key in Object.keys(connections))) res.status(400).send({ message: '' });
               if((connections[key].RandSignedInt()) !== parseInt(isaacData, 16)) res.status(401).send({ message: '' });
               handlerUp(req, res);
               break;
            case "get":
               let key = req.query.key;
               let isaacData = req.query.otherkey;
               if((key.length != 24) || (!key.test(/[0-9A-Fa-f]{6}/g)) res.status(400).send({ message: '' });
               if((isaacData.length != 8) || (!isaacData.test(/[0-9A-Fa-f]{6}/g)) res.status(400).send({ message: '' });
               let key_u8a = fromHex(key);
               if(!(key in Object.keys(connections))) res.status(404).send({ message: '' });
               if((connections[key].RandSignedInt()) !== parseInt(isaacData, 16)) res.status(401).send({ message: '' });
               handlerDown(req, res);
               break;
            case "close":
               let key = req.query.key;
               let isaacData = req.query.otherkey;
               if((key.length != 24) || (!key.test(/[0-9A-Fa-f]{6}/g)) res.status(400).send({ message: '' });
               if((isaacData.length != 8) || (!isaacData.test(/[0-9A-Fa-f]{6}/g)) res.status(400).send({ message: '' });
               let key_u8a = fromHex(key);
               if(!(key in Object.keys(connections))) res.status(400).send({ message: '' });
               if((connections[key].RandSignedInt()) !== parseInt(isaacData, 16)) res.status(401).send({ message: '' });
               delete connections[key];
               handlerUp(req, res);
               break;
           default:
               res.status(400).send({ message: '' });
               break;
        };
    });
    return [connections, reciever];
};
