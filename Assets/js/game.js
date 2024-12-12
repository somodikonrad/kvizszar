const newAnswerField = document.querySelector('#newAnswer');
    const submitAnswerBtn = document.querySelector('#submitAnswerBtn');
    const questionElement = document.querySelector('#question');
    const playerList = document.querySelector('#playerList');
    const exitQuizBtn = document.querySelector('#exitQuizBtn');
 
 
    const socket = io();
 
    socket.emit('joinToChat'), { roomName: document.getElementById('rooms') };
 
    socket.on('updateRoomUsers', (roomUsers)=>{
        playerList.innerHTML = '';
        let ul = document.createElement('ul');
        playerList.appendChild(ul);
        roomUsers.forEach(roomUser => {
            let li = document.createElement('li');
            li.innerText = roomUser.username;
            ul.appendChild(li);
        });
    });
 
    socket.on('roomFull', (data) => {
        alert(data.message); // Megjeleníti a figyelmeztetést
        window.location.href = data.redirect; // Visszairányít az index.ejs oldalra
    });
 
 
    socket.on('tenQuestion', (data) => {
       
        window.location.href = data.redirect; // Visszairányít az index.ejs oldalra
    });
    // Kérdés fogadása
    socket.on('newQuestion', (questionText) => {
        displayQuestion(questionText);
    });
 
    // Válasz beküldése
    submitAnswerBtn.addEventListener('click', sendAnswer);
    newAnswerField.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendAnswer();
        }
    });
 
    function sendAnswer() {
        const answer = newAnswerField.value.trim();
        if (answer !== '') {
            socket.emit('submitAnswer', answer);
            newAnswerField.value = '';
        } else {
            alert('Kérlek, írj be egy választ!');
        }
    }
   
    socket.on('answerFeedback', (feedback) => {
        alert(feedback);
    });
   
 
    function displayQuestion(questionText) {
        questionElement.textContent = questionText;
        questionElement.classList.add('question-appear');
        setTimeout(() => {
            questionElement.classList.remove('question-appear');
        }, 800);
    }
 
    // Visszajelzés fogadása
    socket.on('answerFeedback', (feedback) => {
        alert(feedback);
    });
 
 