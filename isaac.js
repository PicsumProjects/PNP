"use strict";
var ISAAC = function (seed) {
    this.count = 0;
    this.a = 0;
    this.b = 0;
    this.c = 0;

    var isarray = false;
    if (typeof seed !== "undefined" && seed !== null) {
        if (seed instanceof Uint32Array)
            isarray = true;
        else
            throw "Expected seed to be a Uint32Array";
    }

    this.mem = new Uint32Array(this.SIZE);
    this.rsl = new Uint32Array(this.SIZE);

    if (isarray && seed.length > 0) {
        for (var i = 0; i < seed.length; i++) {
            this.rsl[i] = seed[i];
        }
        this.Init(true);
    } else
        this.Init(false);
};
module.exports = ISAAC;
ISAAC.prototype.SIZEL = 8;
ISAAC.prototype.SIZE = 1 << ISAAC.prototype.SIZEL;
ISAAC.prototype.HALFSIZE = ISAAC.prototype.SIZE / 2;
ISAAC.prototype.MASK = (ISAAC.prototype.SIZE - 1) << 2;

ISAAC.prototype.Isaac = function () {
    var i, j, x, y, a, b, c, mem, rsl, HALFSIZE, MASK, SIZEL;

    a = this.a;
    b = this.b;
    c = this.c;
    mem = this.mem;
    rsl = this.rsl;
    HALFSIZE = this.HALFSIZE;
    MASK = this.MASK;
    SIZEL = this.SIZEL;

    c = (c + 1) >>> 0;
    b = (b + c) >>> 0;
    for (i = 0, j = HALFSIZE; i < HALFSIZE;) {
        x = mem[i];
        a ^= a << 13;
        a += mem[j++];
        mem[i] = y = mem[(x & MASK) >> 2] + a + b;
        rsl[i++] = b = mem[((y >> SIZEL) & MASK) >> 2] + x;

        x = mem[i];
        a ^= a >>> 6;
        a += mem[j++];
        mem[i] = y = mem[(x & MASK) >> 2] + a + b;
        rsl[i++] = b = mem[((y >> SIZEL) & MASK) >> 2] + x;

        x = mem[i];
        a ^= a << 2;
        a += mem[j++];
        mem[i] = y = mem[(x & MASK) >> 2] + a + b;
        rsl[i++] = b = mem[((y >> SIZEL) & MASK) >> 2] + x;

        x = mem[i];
        a ^= a >>> 16;
        a += mem[j++];
        mem[i] = y = mem[(x & MASK) >> 2] + a + b;
        rsl[i++] = b = mem[((y >> SIZEL) & MASK) >> 2] + x;
    }


    for (j = 0; j < HALFSIZE;) {
        x = mem[i];
        a ^= a << 13;
        a += mem[j++];
        mem[i] = y = mem[(x & MASK) >> 2] + a + b;
        rsl[i++] = b = mem[((y >> SIZEL) & MASK) >> 2] + x;

        x = mem[i];
        a ^= a >>> 6;
        a += mem[j++];
        mem[i] = y = mem[(x & MASK) >> 2] + a + b;
        rsl[i++] = b = mem[((y >> SIZEL) & MASK) >> 2] + x;

        x = mem[i];
        a ^= a << 2;
        a += mem[j++];
        mem[i] = y = mem[(x & MASK) >> 2] + a + b;
        rsl[i++] = b = mem[((y >> SIZEL) & MASK) >> 2] + x;

        x = mem[i];
        a ^= a >>> 16;
        a += mem[j++];
        mem[i] = y = mem[(x & MASK) >> 2] + a + b;
        rsl[i++] = b = mem[((y >> SIZEL) & MASK) >> 2] + x;
    }

    this.a = a;
    this.b = b;
    this.c = c;
    this.mem = mem;
    this.rsl = rsl;
};

ISAAC.prototype.Init = function (flag) {
    if (typeof flag !== "boolean")
        throw "Expected flag to be boolean";

    var i;
    var a, b, c, d, e, f, g, h;

    a = b = c = d = e = f = g = h = 0x9e3779b9;

    function mix() {
        a ^= b << 11; d += a; b += c;
        b ^= c >>> 2; e += b; c += d;
        c ^= d << 8; f += c; d += e;
        d ^= e >>> 16; g += d; e += f;
        e ^= f << 10; h += e; f += g;
        f ^= g >>> 4; a += f; g += h;
        g ^= h << 8; b += g; h += a;
        h ^= a >>> 9; c += h; a += b;
    }

    for (i = 0; i < 4; ++i)
        mix();

    for (i = 0; i < this.SIZE; i += 8) {
        if (flag) {
            a += this.rsl[i]; b += this.rsl[i + 1]; c += this.rsl[i + 2]; d += this.rsl[i + 3];
            e += this.rsl[i + 4]; f += this.rsl[i + 5]; g += this.rsl[i + 6]; h += this.rsl[i + 7];
        }

        mix();

        this.mem[i] = a; this.mem[i + 1] = b; this.mem[i + 2] = c; this.mem[i + 3] = d;
        this.mem[i + 4] = e; this.mem[i + 5] = f; this.mem[i + 6] = g; this.mem[i + 7] = h;
    }

    if (flag) {
        for (i = 0; i < this.SIZE; i += 8) {
            a += this.mem[i]; b += this.mem[i + 1]; c += this.mem[i + 2]; d += this.mem[i + 3];
            e += this.mem[i + 4]; f += this.mem[i + 5]; g += this.mem[i + 6]; h += this.mem[i + 7];

            mix();

            this.mem[i] = a; this.mem[i + 1] = b; this.mem[i + 2] = c; this.mem[i + 3] = d;
            this.mem[i + 4] = e; this.mem[i + 5] = f; this.mem[i + 6] = g; this.mem[i + 7] = h;
        }
    }

    this.Isaac();
    this.count = this.SIZE;
};

ISAAC.prototype.Rand = function () {
    return !this.count-- ? (this.Isaac(), this.count = this.SIZE - 1, this.rsl[this.count]) : this.rsl[this.count];
};
ISAAC.prototype.RandSignedInt = function () {
    return this.Rand() | 0;
};
//All numbers in Javascript are 64-bit floating point numbers (double). So 'Float' in this context really means _double_.
ISAAC.RandFloatConstant = 1.0 / 4294967295;
ISAAC.prototype.RandFloat = function () {
    return this.Rand() * ISAAC.RandFloatConstant; //[0..1),
};
ISAAC.prototype.RandFloatExact = function () {
    var buffer = new ArrayBuffer(8);
    var temp = new Uint32Array(buffer);
    temp[0] = this.Rand();
    temp[1] = this.Rand();
    return new Float64Array(buffer)[0]; //Literally as random as possible. No idea what the use case for this is, oh well.
};
ISAAC.prototype.RandRange = function (min, max) {
    if (typeof max !== "number") //Only min is defined, treat it as [0..min)
        return (this.RandFloat() * min) | 0;

    var range = max - min;
    return (this.RandFloat() * range + min) | 0;
};
ISAAC.prototype.RandFloatRange = function (min, max) {
    if (typeof max !== "number") //Only min is defined, treat it as max.
        return this.RandFloat() * min;

    var range = max - min;
    return this.RandFloat() * range + min;
};

ISAAC.StringToUintArray = function (seedtext) {
    var seed = new Uint32Array(Math.ceil(seedtext.length / 4));
    for (var i = 0, j = 0; i < seedtext.length; i++) {
        switch (i & 3) {
            case 0:
                seed[j] |= seedtext.charCodeAt(i);
                break;
            case 1:
                seed[j] |= seedtext.charCodeAt(i) << 8;
                break;
            case 2:
                seed[j] |= seedtext.charCodeAt(i) << 16;
                break;
            case 3:
                seed[j] |= seedtext.charCodeAt(i) << 24;
                j++;
                break;
        }
    }
    return seed;
};
