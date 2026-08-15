function drawStickman(x, y, name, admin, mine) {

    ctx.save();

    ctx.translate(x, y);

    // رنگ اسکین
    const skin = mine ? "#facc15" : "#f8fafc";
    const shirt = admin ? "#ef4444" : "#2563eb";

    // سایه
    ctx.beginPath();
    ctx.ellipse(
        0,
        58,
        24,
        7,
        0,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "#0005";
    ctx.fill();


    // =====================
    // سر
    // =====================

    ctx.beginPath();

    ctx.arc(
        0,
        -35,
        18,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = skin;
    ctx.fill();

    ctx.lineWidth = 4;
    ctx.strokeStyle = "#111827";
    ctx.stroke();


    // مو
    ctx.beginPath();

    ctx.arc(
        0,
        -43,
        16,
        Math.PI,
        Math.PI * 2
    );

    ctx.fillStyle = "#111827";
    ctx.fill();


    // چشم چپ
    ctx.beginPath();

    ctx.arc(
        -6,
        -36,
        2.5,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "#111827";
    ctx.fill();


    // چشم راست
    ctx.beginPath();

    ctx.arc(
        6,
        -36,
        2.5,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // لبخند
    ctx.beginPath();

    ctx.arc(
        0,
        -31,
        7,
        0,
        Math.PI
    );

    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2;
    ctx.stroke();


    // =====================
    // بدن
    // =====================

    ctx.beginPath();

    ctx.roundRect(
        -16,
        -16,
        32,
        42,
        8
    );

    ctx.fillStyle = shirt;
    ctx.fill();

    ctx.lineWidth = 4;
    ctx.strokeStyle = "#111827";
    ctx.stroke();


    // =====================
    // دست چپ
    // =====================

    ctx.beginPath();

    ctx.moveTo(
        -14,
        -5
    );

    ctx.lineTo(
        -31,
        18
    );

    ctx.lineTo(
        -36,
        13
    );

    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.stroke();


    // =====================
    // دست راست
    // =====================

    ctx.beginPath();

    ctx.moveTo(
        14,
        -5
    );

    ctx.lineTo(
        31,
        18
    );

    ctx.lineTo(
        36,
        13
    );

    ctx.stroke();


    // =====================
    // پا چپ
    // =====================

    ctx.beginPath();

    ctx.moveTo(
        -8,
        25
    );

    ctx.lineTo(
        -20,
        52
    );

    ctx.lineTo(
        -27,
        52
    );

    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 8;
    ctx.stroke();


    // =====================
    // پا راست
    // =====================

    ctx.beginPath();

    ctx.moveTo(
        8,
        25
    );

    ctx.lineTo(
        20,
        52
    );

    ctx.lineTo(
        27,
        52
    );

    ctx.stroke();


    // =====================
    // اسم
    // =====================

    ctx.font =
        "bold 16px Arial";

    ctx.textAlign =
        "center";

    ctx.lineWidth = 3;

    ctx.strokeStyle =
        "#000";

    ctx.strokeText(
        name + (admin ? " 👑" : ""),
        0,
        -65
    );

    ctx.fillStyle =
        "#fff";

    ctx.fillText(
        name + (admin ? " 👑" : ""),
        0,
        -65
    );


    ctx.restore();
}
