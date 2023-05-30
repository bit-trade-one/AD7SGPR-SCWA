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
          document.getElementById("output-text").value += value + '\n';
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
    inputText.value = "?CLR";
  });
});