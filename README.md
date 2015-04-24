# litecast
A video conversation platform built for data-contsrained settings. This is a rebuild of litecast built with golang.

## How it works
1. Litecast client opens TCP connection to the Litecast server. This connection is called a conduit, and it will be used for P2P message passing later. The conduit operates on a request/response model (mimics a two-way HTTP connection)
2. Litecast client sends an `/authenticate` request to the Litecast server over the conduit
3. Litecast server either responds with an `OK`, `Fault`, or `Error`. Think of `OK` as an HTTP 200-299, `Fault` as an HTTP 400-499, and an `Error` as an HTTP  500-599. If the response is favorable (`OK`), then the server will include an authentication token. This authentication *must* be used on all requests thereafter; otherwise, the server will send a `Fault` of type `Unauthorized` in response.
4. Litecast client sends a `/call/start` request to the Litecast server over the conduit. The request includes a target `userId` to call. If no such `userId` is currently connected, then a `Fault` of type `Bad Request` is returned.
5. Litecast client sends a `/call/request` request to the Litecast client matching the previously given `userId`. If this client responds affirmatively, then the original `/call/start` request receives an affirmative response. At this point clients send a UDP "hello" packet to server. The server records each client's transient IP address. The server then sends each client a `/call/connect` request with the transient ip address included in the body. Each Litecast client then sends UDP "hello" packets to each other until they receive a response. When they do, they both respond affirmatively to the `/call/connect` and begin sending video frames, audio frames and pings.
