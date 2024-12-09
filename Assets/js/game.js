    const newAnswerField = document.querySelector('#newAnswer');
    const submitAnswerBtn = document.querySelector('#submitAnswerBtn');
    const questionElement = document.querySelector('#question');
    const playerList = document.querySelector('#playerList');
    const exitQuizBtn = document.querySelector('#exitQuizBtn');


    const socket = io();

    socket.emit('joinToChat');

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

    socket.on('roomFull', (message) => {
        alert(message);
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

