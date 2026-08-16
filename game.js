const socket = io();

let myPlayer = null;
let roomCode = null;
let players = {};

const createRoomButton =
  document.getElementById(
    "createRoom"
  );

const joinRoomButton =
  document.getElementById(
    "joinRoom"
  );

const roomCodeInput =
  document.getElementById(
    "roomCode"
  );

const playerNameInput =
  document.getElementById(
    "playerName"
  );

const roomCodeDisplay =
  document.getElementById(
    "roomCodeDisplay"
  );

function getPlayerName() {
  if (
    playerNameInput &&
    playerNameInput.value.trim()
  ) {
    return playerNameInput.value
      .trim()
      .substring(0, 20);
  }

  return "Player";
}

// =====================================
// ساخت اتاق
// =====================================

if (createRoomButton) {
  createRoomButton.addEventListener(
    "click",
    () => {
      createRoomButton.disabled = true;

      createRoomButton.textContent =
        "در حال ساخت اتاق...";

      socket.emit(
        "createRoom",
        {
          name: getPlayerName(),
          color: "#ffffff"
        }
      );
    }
  );
}

// =====================================
// اتاق ساخته شد
// =====================================

socket.on(
  "roomCreated",
  (data) => {
    roomCode =
      data.roomCode;

    myPlayer =
      data.player;

    players = {};

    data.players.forEach(
      (player) => {
        players[player.id] =
          player;
      }
    );

    showRoomCode(roomCode);

    console.log(
      "Room created:",
      roomCode
    );

    if (createRoomButton) {
      createRoomButton.disabled =
        false;

      createRoomButton.textContent =
        "ساخت اتاق";
    }

    startGame();
  }
);

// =====================================
// نمایش کد اتاق
// =====================================

function showRoomCode(code) {
  if (!roomCodeDisplay) return;

  roomCodeDisplay.textContent =
    code;

  roomCodeDisplay.style.display =
    "block";
}

// =====================================
// ورود به اتاق
// =====================================

if (joinRoomButton) {
  joinRoomButton.addEventListener(
    "click",
    () => {
      let code =
        roomCodeInput
          ? roomCodeInput.value
          : "";

      // فقط عدد
      code = String(code)
        .replace(/\D/g, "");

      if (code.length !== 6) {
        alert(
          "کد اتاق باید ۶ رقمی باشد."
        );

        return;
      }

      joinRoomButton.disabled =
        true;

      joinRoomButton.textContent =
        "در حال ورود...";

      socket.emit(
        "joinRoom",
        {
          roomCode: code,
          name: getPlayerName(),
          color: "#ffffff"
        }
      );
    }
  );
}

// =====================================
// ورود موفق
// =====================================

socket.on(
  "roomJoined",
  (data) => {
    roomCode =
      data.roomCode;

    myPlayer =
      data.player;

    players = {};

    data.players.forEach(
      (player) => {
        players[player.id] =
          player;
      }
    );

    showRoomCode(roomCode);

    console.log(
      "Joined room:",
      roomCode
    );

    if (joinRoomButton) {
      joinRoomButton.disabled =
        false;

      joinRoomButton.textContent =
        "ورود به اتاق";
    }

    startGame();
  }
);

// =====================================
// خطای اتاق
// =====================================

socket.on(
  "roomError",
  (message) => {
    alert(message);

    if (createRoomButton) {
      createRoomButton.disabled =
        false;

      createRoomButton.textContent =
        "ساخت اتاق";
    }

    if (joinRoomButton) {
      joinRoomButton.disabled =
        false;

      joinRoomButton.textContent =
        "ورود به اتاق";
    }
  }
);

// =====================================
// بازیکنان فعلی
// =====================================

socket.on(
  "roomPlayers",
  (list) => {
    players = {};

    list.forEach(
      (player) => {
        players[player.id] =
          player;
      }
    );

    updateGamePlayers();
  }
);

// =====================================
// بازیکن جدید
// =====================================

socket.on(
  "playerJoined",
  (player) => {
    players[player.id] =
      player;

    updateGamePlayers();
  }
);

// =====================================
// حرکت بازیکن
// =====================================

socket.on(
  "playerMoved",
  (player) => {
    players[player.id] =
      player;

    updateGamePlayers();
  }
);

// =====================================
// تغییر بازیکن
// =====================================

socket.on(
  "playerUpdated",
  (player) => {
    players[player.id] =
      player;

    updateGamePlayers();
  }
);

// =====================================
// بازیکن خارج شد
// =====================================

socket.on(
  "playerLeft",
  (playerId) => {
    delete players[playerId];

    updateGamePlayers();
  }
);

// =====================================
// شروع بازی
// =====================================

function startGame() {
  console.log(
    "Game started"
  );

  updateGamePlayers();
}

// =====================================
// آپدیت بازی
// =====================================

function updateGamePlayers() {
  /*
   این قسمت را می‌توانی با
   سیستم گرافیکی فعلی بازی‌ات
   وصل کنی.

   اطلاعات بازیکنان داخل:
   players
   قرار دارد.
  */

  Object.values(players).forEach(
    (player) => {
      // بازیکنان اینجا مدیریت می‌شوند
    }
  );
}

// =====================================
// حرکت بازیکن خودمان
// =====================================

function sendMovement(x, y) {
  if (!roomCode) return;

  socket.emit(
    "playerMovement",
    {
      x: x,
      y: y
    }
  );
}

// =====================================
// تغییر نام
// =====================================

function updatePlayerName(name) {
  socket.emit(
    "updatePlayer",
    {
      name: name
    }
  );
}

// =====================================
// چت
// =====================================

function sendChat(message) {
  if (!roomCode) return;

  socket.emit(
    "chatMessage",
    message
  );
}

socket.on(
  "chatMessage",
  (data) => {
    console.log(
      data.name +
      ": " +
      data.message
    );
  }
);

// =====================================
// میزبان جدید
// =====================================

socket.on(
  "newHost",
  (playerId) => {
    if (players[playerId]) {
      players[playerId].isHost =
        true;
    }

    updateGamePlayers();
  }
);
