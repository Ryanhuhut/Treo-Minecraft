const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const mineflayer = require('mineflayer');

const app = express();
const server = http.createServer(app);
const io = socketIo(server); // ⚠️ ĐÂY là dòng quan trọng

app.use(express.static('public')); // Để web client hoạt động

let autoReconnect = true;
let bot = null;
let jumpInterval = null;
let chatInterval = null;
let nightEscapeInterval = null;

function stopBot() {
  try {
    if (bot && typeof bot.quit === 'function') {
      bot.quit('Night Escape or Manual Stop');
    }
  } catch (err) {
    console.log('⚠️ Quit Error:', err.message);
  } finally {
    bot = null;
    clearInterval(jumpInterval);
    clearInterval(chatInterval);
    clearInterval(nightEscapeInterval);
    console.log('🧹 Bot đã dừng và dọn sạch.');

    if (autoReconnect) {
      console.log('🔁 Đang đợi 10 giây để vào lại server...');
      setTimeout(() => {
        createBot();
      }, 10000);
    }
  }
}

function createBot() {
  if (bot) {
    console.log('⚠️ Bot đã tồn tại, không tạo mới.');
    return;
  }

  try {
    bot = mineflayer.createBot({
      host: 'Ryanhuhut.aternos.me',
      port: 31737,
      username: 'Operator'
    });
  } catch (err) {
    console.log('❌ Lỗi khi tạo bot:', err.message);
    return setTimeout(createBot, 15000);
  }

  bot.on('spawn', () => {
    console.log('✅ Bot đã vào server!');

    jumpInterval = setInterval(() => {
      if (bot.entity?.onGround) {
        bot.setControlState('jump', true);
        setTimeout(() => bot.setControlState('jump', false), 500);
      }
    }, 60 * 1000);

    chatInterval = setInterval(() => {
      if (bot && bot.player) {
        try {
          bot.chat('Hi');
        } catch (err) {
          console.log('⚠️ Chat Error:', err.message);
        }
      }
    }, 5 * 60 * 1000);

    setTimeout(() => {
      nightEscapeInterval = setInterval(() => {
        const time = bot.time?.timeOfDay || 0;
        const isNight = time > 13000 && time < 23000;
        const players = Object.keys(bot.players || {});
        const otherPlayers = players.filter(p => p !== bot.username);
        if (isNight && otherPlayers.length > 0) {
          console.log('🌙 Night Escape: Trời tối + có người khác → bot thoát!');
          bot.chat('Tạm biệt! Tôi đi ngủ đây...');
          stopBot();
        }
      }, 10 * 1000);
    }, 10000);
  });

  bot.on('end', () => {
    console.log('🛑 Bot bị disconnect.');
    stopBot();
  });

  bot.on('error', (err) => {
    console.log('❌ Bot Error:', err.message);
    stopBot();
  });
}

io.on('connection', socket => {
  console.log('🌐 Web client connected.');

  socket.on('start', () => {
    autoReconnect = true;
    createBot();
  });

  socket.on('stop', () => {
    autoReconnect = false;
    stopBot();
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🌍 Server web chạy tại http://localhost:${PORT}`);
});
