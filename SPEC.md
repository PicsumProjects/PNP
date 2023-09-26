# PNP spec

This is the spec for PNP (Picsum Networking Protocol.)

If any request is incorrect, send a 400 error code if it's unknown, and 401 if it's auth.

## Creating a connection

The way to do this is to generate a random key (of 12 bytes encoded in hex), and send it this way over HTTP(S), as a GET request:

`http(s)://(server url):(port)/(PNP over HTTP endpoint)/?msg=connect&key=(random key in hex)&(any params here)`

Then a server stores that key in any key-value store, the key being the random key and the value being an ISAAC CSPRNG that generates 32 bits of output. The RNG will be used later.

An ISAAC cryptorandom number generator must be created for the connection (the seed being the initial key sent), and the connection is identified using the key.

The timeout the server will wait for a subsequent send data or get data (not the HTTP method) request is specified in the result of the request, like this:

maxSendTimeout: 3600 _(in ms)_
maxGetTimeout: 3600 _(in ms)_

## Send data over connection

The way to do this is to then get 12 bytes from the ISAAC cryptorandom number generator created beforehand, and send a GET request like this:

`http(must have ssl if the previous request had SSL)://(server url):(same port as last request)/(PNP over HTTP endpoint)/?msg=send&key=(same key as last request in hex)&otherkey=(data from ISAAC RNG)`

When a server sees a request for sending data, it must increment the value of the key sent beforehand to create the connection, and get 12 bytes from the ISAAC RNG, and if the sent key in the request is not equal, then a 401 (Unauthorized) code will be sent and the connection will be closed. If the client sees the code 401, it will know that the connection has closed and will do no futher action.

If not, however, that means the data has been sent correctly, and the server may process the data sent, which is in the body of the request.

If the server sends a 202 code, and the body of the response from the server is parsable as a base-10 unsigned integer, then the number sent in the response is how long the client should wait for the next get data request.

If the server sends a 202 code, _however_ the result isn't parsable as a base-10 unsigned integer, then the client may wait 100 ms until the next get data request. If it has continuously sent get data requests, and the server has responded with a 202 code 49 times beforehand, the connection to the clent must be recieved as closed.

## Get data sent from server

The client must send a GET request the same as sending data over connections, but the server will respond with the data it wants to send, and it's message parameter is "get", not "send".

## Close connection (client)

Same thing as sending data over connection, but the "msg" query parameter must be "close".

## Close connection (server)

Note: Does not apply to error codes, the client will know the connection is closed on an error code.

On the next get data request, the server must respond with 404.

# Encryption

In order to encrypt data, it is encrypted on both sides by XORing the data going to the server with the count of send requests from the client XOR the ISAAC data XOR the count of send requests from the server * 2.

The client must send a URL query param `&encrypt=1` to encryt the connection, and the server MUST follow through.

# Compression

The compression is done by HTTP compression.
