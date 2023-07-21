class LineBreakTransformer {
  constructor(lineBreakType) {
    this.chunks = "";
    this.lineBreakType = lineBreakType;
  }

  transform(chunk, controller) {
    this.chunks += chunk;
    let lineBreak;
    if (this.lineBreakType === "CRLF") {
      lineBreak = "\r\n";
    } else if (this.lineBreakType === "LF") {
      lineBreak = "\n";
    } else if (this.lineBreakType === "CR") {
      lineBreak = "\r";
    }
    const lines = this.chunks.split(lineBreak);
    this.chunks = lines.pop();
    lines.forEach((line) => controller.enqueue(line));
  }

  flush(controller) {
    controller.enqueue(this.chunks);
  }
}

let port;

async function onStartButtonClick() {
  const lineBreakSelect = document.getElementById("linebreak-select");
  const selectedLineBreak = lineBreakSelect.value;
  const baudRateSelect = document.getElementById("baudrate-select");
  const selectedBaudRate = parseInt(baudRateSelect.value, 10);

  try {
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: selectedBaudRate });

    while (port.readable) {
      const textDecoder = new TextDecoderStream();
      const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
      // ここで、selectedLineBreakをLineBreakTransformerに渡す
      const reader = textDecoder.readable
        .pipeThrough(new TransformStream(new LineBreakTransformer(selectedLineBreak)))
        .getReader();

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            console.log("Canceled");
            break;
          }
          const outputText = document.getElementById("output-text");
          outputText.value += value + '\n';
          outputText.scrollTop = outputText.scrollHeight;
          
        }
      } catch (error) {
        console.log("Error: Read");
        console.log(error);
      } finally {
        reader.releaseLock();
      }
    }
  } catch (error) {
    console.log("Error: Open");
    console.log(error);
  }
}

async function writeText(text) {
  const encoder = new TextEncoder();
  const writer = port.writable.getWriter();
  await writer.write(encoder.encode(text));
  console.log("テキスト書き込み: " + text);
  writer.releaseLock();
}

document.addEventListener("DOMContentLoaded", () => {
  const sendButton = document.getElementById("send-button");
  const inputText = document.getElementById("input-text");
  const quickClrButton = document.getElementById("quick-clr");
  const quickAni0Button = document.getElementById("quick-ani0");
  const quickAni1Button = document.getElementById("quick-ani1");
  const quickAni2Button = document.getElementById("quick-ani2");
  const quick7sg0Button = document.getElementById("quick-7sg0");
  const quick7sg1Button = document.getElementById("quick-7sg1");
  const quicksgrButton = document.getElementById("quick-sgr");
  const quickBriButtons = Array.from({length: 8}, (_, i) => document.getElementById(`quick-bri${i}`));
  const quickBrrButton = document.getElementById("quick-brr");
  const quickHexButton = document.getElementById("quick-hex");
  const quickHexFFFFFFFFFFFFFFFFButton = document.getElementById("quick-hexffffffffffffffff");
  const quickHexFF00000000000000Button = document.getElementById("quick-hexff00000000000000");
  const clearOutputButton = document.getElementById("clear-output");

  sendButton.addEventListener("click", () => {
    if (!port) {
      alert("シリアルポートが接続されていません");
      return;
    }
    writeText(inputText.value + "\n");
    inputText.value = ""; // テキストボックスの中を消す
  });

  // エンターキーで送信
  inputText.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (!port) {
        alert("シリアルポートが接続されていません");
        return;
      }
      writeText(inputText.value + "\n");
      inputText.value = ""; // テキストボックスの中を消す
    }
  });

  quickClrButton.addEventListener("click", function () {
    inputText.value = "@CLR";
  });

  quickAni0Button.addEventListener("click", function () {
    inputText.value = "@ANI0";
  });

  quickAni1Button.addEventListener("click", function () {
    inputText.value = "@ANI1";
  });

  quickAni2Button.addEventListener("click", function () {
    inputText.value = "@ANI2";
  });

  quick7sg0Button.addEventListener("click", function () {
    inputText.value = "@7SG0";
  });

  quick7sg1Button.addEventListener("click", function () {
    inputText.value = "@7SG1";
  });

  quicksgrButton.addEventListener("click", function () {
    inputText.value = "@SGR";
  });

  quickBriButtons.forEach((button, i) => {
    button.addEventListener("click", function () {
      inputText.value = `@BRI${i}`;
    });
  });

  quickBrrButton.addEventListener("click", function () {
    inputText.value = "@BRR";
  });

  quickHexButton.addEventListener("click", function () {
    inputText.value = "@HEX";
  });

  quickHexFFFFFFFFFFFFFFFFButton.addEventListener("click", function () {
    inputText.value = "@HEXFFFFFFFFFFFFFFFF";
  });

  quickHexFF00000000000000Button.addEventListener("click", function () {
    inputText.value = "@HEXFF00000000000000";
  });

  clearOutputButton.addEventListener("click", function () { // 追加するコード
    const outputText = document.getElementById("output-text");
    outputText.value = "";
  });
});
