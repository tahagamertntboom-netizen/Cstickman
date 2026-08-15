function enterLobby() {
  let name = document.getElementById("playerName").value;

  if (name.trim() === "") {
    alert("اسم وارد کن");
    return;
  }

  localStorage.setItem("playerName", name);

  window.location.href = "game.html";
}
