const net = require('net');

const TARGET_HOST = '192.168.192.1';
const TARGET_PORT = 9222;
const LOCAL_PORT = 9222;

const server = net.createServer(socket => {
    const client = new net.Socket();

    client.connect(TARGET_PORT, TARGET_HOST, () => {
        socket.pipe(client).pipe(socket);
    });

    client.on('error', (err) => {
        console.error('Erro na conexão com Chrome:', err.message);
        socket.end();
    });

    socket.on('error', (err) => {
        console.error('Erro na conexão local:', err.message);
        client.end();
    });
});

server.listen(LOCAL_PORT, '127.0.0.1', () => {
    console.log(`TCP Proxy rodando: 127.0.0.1:${LOCAL_PORT} -> ${TARGET_HOST}:${TARGET_PORT}`);
});
