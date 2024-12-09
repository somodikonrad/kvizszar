let nameField = document.querySelector('#name');
let roomField = document.querySelector('#room');
let roomsSelect = document.querySelector('#rooms');
let joinBtn = document.querySelector('#join');

const socket = io();

joinBtn.addEventListener('click', ()=>{
    if (nameField.value == ''){
        alert('Missing username!');
        return
    }

    if (roomField.value == '' && roomsSelect.value == ''){
        alert('Missing roomname!');
        return
    }

    let username = nameField.value;
    let room = roomField.value;
    
    if (roomsSelect.value != ''){
        room = roomsSelect.value;
    }

    document.location.href = `/game/${room}/${username}`;

});

socket.emit('getRoomList');

socket.on('updateRoomList', (rooms)=>{
    roomsSelect.innerHTML = '<option value="" selected>Join to an existing room: </option>';
    rooms.forEach(room => {
        let option = document.createElement('option');
        option.value = room;
        option.innerText = room;
        roomsSelect.appendChild(option);
    });

});