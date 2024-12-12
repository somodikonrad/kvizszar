require('dotenv').config();
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const ejs = require('ejs');
const mysql = require('mysql');
const session = require('express-session');
 
// Alap beállítások
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
 
const { users, rooms, userJoin, userLeave, getRoomUsers, getCurrentUser, inRoomsList, roomLeave } = require('./utils');
 
const coreRoutes = require('./Modules/core');
app.use('/', coreRoutes);
 
// Szerver és Socket.IO beállítások
const server = http.createServer(app);
const io = socketio(server);
 
 
// Adatbázis kapcsolódás
const pool = mysql.createPool({
    connectionLimit: process.env.CONNECTIONLIMIT,
    host: process.env.DBHOST,
    user: process.env.DBUSER,
    password: process.env.DBPASS,
    database: process.env.DBNAME
});
 
// Stílusok és statikus fájlok
app.use('/Assets', express.static('Assets'));
 
// Session kezelés (ha szükséges)
app.use(session({
    secret: 'secret-key', // Titkos kulcs
    resave: false,
    saveUninitialized: true,
}));
 
// EJS renderelés
app.get('/', (_req, res) => {
    res.render('index.ejs');
});
 
app.get('/game/:room/:user', (req, res) => {
    session.user = req.params.user;
    session.room = req.params.room;
    res.render('game.ejs', { user: session.user, room: session.room });
});
 
app.get('/winner', (req, res) => {
    session.user = req.params.user;
    session.room = req.params.room;
    res.render('win.ejs', { user: session.user, room: session.room });
});
 
 
// Socket.IO kapcsolat kezelése
io.on('connection', (socket) => {
    //console.log('Egy felhasználó csatlakozott:', socket.id);
 
    socket.on('getRoomList', ()=>{
        io.emit('updateRoomList', rooms)
    });
 
    socket.on('joinToChat', () => {
        const roomUsers = getRoomUsers(session.room); // Lekérjük a szoba aktuális felhasználóit
   
        if (roomUsers.length >= 5) {
            // Ha a szoba már tele van, küldünk egy üzenetet az új felhasználónak, majd visszairányítjuk
            socket.emit('roomFull', {
                message: 'The room is full, maximum 5 users allowed.',
                redirect: '/' // Az index.ejs oldalra irányít
            });
            return;
        } else {
            // Normál csatlakozás, ha van hely a szobában
            let user = userJoin(socket.id, session.user, session.room);
            socket.join(session.room);
   
            // Frissítjük a szoba állapotát
            io.to(session.room).emit('updateRoomUsers', getRoomUsers(session.room));
            io.to(session.room).emit('userConnected', user);
   
            // Ha a szoba még nincs a szobalistában, hozzáadjuk
            if (!inRoomsList(session.room)) {
                rooms.push(session.room);
                io.emit('updateRoomList', rooms);
            }
        }
    });
   
   
    let questionCounter = 0;
    let userScores = {};
 
    // Függvény a véletlenszerű kérdés lekérésére
    const getNewQuestion = () => {
        pool.query('SELECT * FROM questions ORDER BY RAND() LIMIT 1', (err, results) => {
            if (err) {
                console.error('Hiba a kérdés lekérésekor:', err);
                socket.emit('newQuestion', 'Hiba történt a kérdés betöltése közben.');
                return;
            }
 
            if (results.length > 0 ) {
 
                if (questionCounter < 10) {
                    const question = results[0].question;
                socket.emit('newQuestion', question);
                questionCounter++;
                }
                else{ socket.emit('tenQuestion', {
                   
                    redirect: '/winner' // Az index.ejs oldalra irányít
                });}
               
            } else {
                socket.emit('newQuestion', 'Nincs elérhető kérdés.');
            }
        });
    };
 
    // Az első kérdés elküldése azonnal
    getNewQuestion();
   
   
   
    // 5 másodpercenként új kérdés lekérése
    const intervalId =setInterval(getNewQuestion, 2000);
   
    // Felhasználó lecsatlakozása esetén az időzítő törlése
    socket.on('disconnect', () => {
        //console.log('Egy felhasználó kilépett:', socket.id);
        clearInterval(intervalId);
    });
 
 
    console.log('Egy felhasználó csatlakozott:', socket.id);
 
    socket.on('submitAnswer', (answer) => {
        if (!answer || answer.trim() === '') {
            // Ha az üzenet üres
            socket.emit('answerFeedback', 'Üres választ nem küldhetsz!');
            return;
        }
 
        // Ellenőrizzük az adatbázisban, hogy helyes-e a válasz (feltételezve, hogy van egy megfelelő oszlop az adatbázisban)
        pool.query('SELECT * FROM questions WHERE answer = ?', [answer.trim()], (err, results) => {
            if (err) {
                console.error('Hiba az adatbázis-lekérdezés során:', err);
                socket.emit('answerFeedback', 'Hiba történt a válasz ellenőrzése közben.');
                return;
            }
 
            if (results.length > 0) {
                // Helyes válasz esetén
                if (!userScores[socket.id]) {
                    userScores[socket.id] = 0; // Ha még nem létezik pontszám a felhasználónak, inicializáljuk
                }
                userScores[socket.id]++; // Pontszám növelése
   
                socket.emit('answerFeedback', `Helyes válasz! Gratulálok! Pontszámod: ${userScores[socket.id]}`);
            } else {
                // Helytelen válasz esetén
                socket.emit('answerFeedback', `Ez nem a helyes válasz.  ${userScores[socket.id]}`);
            }
        });
    });
 
 
 
});
 
 
// Szerver indítása
const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});
 
// Csatlakozás ellenőrzése
pool.getConnection((err, connection) => {
    if (err) {
        console.log('Hiba a MySQL kapcsolódásakor: ' + err);
    } else {
        console.log('Sikeres csatlakozás a MySQL adatbázishoz.');
        connection.release();
    }
});
 
// Socket.IO kapcsolat kezelése
 
 
