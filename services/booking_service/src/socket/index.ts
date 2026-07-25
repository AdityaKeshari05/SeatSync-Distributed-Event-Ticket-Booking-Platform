import { Server } from "socket.io";

export const initSocket = (io: Server) =>{
    io.on('connection', (socket) =>{
        console.log('Client Connected: ', socket.id);

        socket.on('joinEvent', (eventId: string) =>{
            socket.join(`event:${eventId}`);
            console.log(`Socekt ${socket.id} join room event ${eventId}`);
        });

        socket.on('disconnect', ()=>{
            console.log('Client Disconnected : ', socket.id);
        });

    });
};