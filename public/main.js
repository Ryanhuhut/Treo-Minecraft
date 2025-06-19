const socket = io();

document.getElementById('startBtn').addEventListener('click', () => {
  socket.emit('start');
});

document.getElementById('stopBtn').addEventListener('click', () => {
  socket.emit('stop');
});
