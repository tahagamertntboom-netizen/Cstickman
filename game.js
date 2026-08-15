function drawStickman(x, y, name, admin, mine) {

    ctx.save();
    ctx.translate(x, y);

    // اگر اسم undefined بود، اسم خود بازیکن را نشان نده
    const playerName =
        name && name !== "undefined"
            ? name
            : (mine ? "Player" : "Stickman");

    // =====================
    // سایه
    // =====================

    ctx.beginPath();
    ctx.ellipse(0, 58, 25, 7, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fill();


    // =====================
    // سر استیکمن
    // =====================

    ctx.beginPath();
    ctx.arc(0, -35, 18, 0, Math.PI * 2);

    ctx.fillStyle = "#ffffff";
    ctx.fill();

    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 4;
    ctx.stroke();


    // =====================
    // صورت
    // =====================

    ctx.fillStyle = "#111827";

    // چشم چپ
    ctx.beginPath();
    ctx.arc(-6, -37, 3, 0, Math.PI * 2);
    ctx.fill();

    // چشم راست
    ctx.beginPath();
    ctx.arc(6, -37, 3, 0, Math.PI * 2);
    ctx.fill();


    // =====================
    // بدن
    // =====================

    ctx.beginPath();
    ctx.moveTo(0, -17);
    ctx.lineTo(0, 25);

    ctx.strokeStyle =
        mine ? "#2563eb" : "#ef4444";

    ctx.lineWidth = 9;
    ctx.lineCap = "round";
    ctx.stroke();


    // =====================
    // دست چپ
    // =====================

    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(-27, 12);

    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 7;
    ctx.stroke();


    // =====================
    // دست راست
    // =====================

    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(27, 12);
    ctx.stroke();


    // =====================
    // پای چپ
    // =====================

    ctx.beginPath();
    ctx.moveTo(0, 25);
    ctx.lineTo(-20, 55);
    ctx.stroke();


    // =====================
    // پای راست
    // =====================

    ctx.beginPath();
    ctx.moveTo(0, 25);
    ctx.lineTo(20, 55);
    ctx.stroke();


    // =====================
    // اسم بالای استیکمن
    // =====================

    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";

    ctx.lineWidth = 4;
    ctx.strokeStyle = "#000";

    ctx.strokeText(
        playerName + (admin ? " 👑" : ""),
        0,
        -68
    );

    ctx.fillStyle = "#fff";

    ctx.fillText(
        playerName + (admin ? " 👑" : ""),
        0,
        -68
    );


    ctx.restore();
}
