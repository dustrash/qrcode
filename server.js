const express = require("express");
const QRCode = require("qrcode");
const { createCanvas, loadImage } = require("canvas");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs"); // HTML 템플릿처럼 사용할 수 있게 EJS 엔진

// EJS 대신 순수 HTML 사용하고 수동 렌더링
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.post("/generate", async (req, res) => {
  const { data, centerText } = req.body;

  try {
    // QR 코드 생성 → data URL
    const qrDataURL = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'H', // 중앙 영역 보호
      margin: 2,
      scale: 8,
    });

    // base64 이미지 → canvas 이미지로 로드
    const qrImage = await loadImage(qrDataURL);
    const canvas = createCanvas(qrImage.width, qrImage.height);
    const ctx = canvas.getContext("2d");

    // QR 이미지 그리기
    ctx.drawImage(qrImage, 0, 0);

    if (centerText) {
      // 폰트 및 스타일 설정
      ctx.font = "bold 20px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // 텍스트 배경 흰색 박스
      const textWidth = ctx.measureText(centerText).width;
      ctx.fillStyle = "white";
      ctx.fillRect(
        (canvas.width - textWidth) / 2 - 4,
        (canvas.height - 20) / 2 - 4,
        textWidth + 8,
        28
      );

      // 중앙 텍스트
      ctx.fillStyle = "black";
      ctx.fillText(centerText, canvas.width / 2, canvas.height / 2);
    }

    // 최종 이미지 생성
    const finalImage = canvas.toDataURL();

    // 결과 HTML 직접 응답
    res.send(`
      <h1>QR 코드 생성 결과</h1>
      <img src="${finalImage}" alt="QR 코드"><br>
      <div class="down_btn">
        <a href="${finalImage}" download><button>이미지 다운로드</button></a>
      </div>
      <a href="/">돌아가기</a>
    `);
  } catch (err) {
    res.status(500).send("QR 코드 생성 중 오류 발생: " + err.message);
  }
});

app.listen(port, () => {
  console.log(`http://localhost:${port} 에서 실행 중`);
});
