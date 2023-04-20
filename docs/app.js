class LineBreakTransformer {
  constructor() {
    this.chunks = "";
  }

  transform(chunk, controller) {
    this.chunks += chunk;
    const lines = this.chunks.split("\r\n");
    this.chunks = lines.pop();
    lines.forEach((line) => controller.enqueue(line));
  }

  flush(controller) {
    controller.enqueue(this.chunks);
  }
}

const sendButton = document.getElementById('send-button');
const inputText = document.getElementById('input-text');
const outputText = document.getElementById('output-text');
const quickClrButton = document.getElementById('quick-clr');
let port;

async function onStartButtonClick() {
  try {
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 9600 });

    while (port.readable) {
      const textDecoder = new TextDecoderStream();
      const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable
        .pipeThrough(new TransformStream(new LineBreakTransformer()))
        .getReader();

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            console.log("Canceled");
            break;
          }
          outputText.value += value + '\n';
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

sendButton.addEventListener("click", function () {
  if (!port) {
    alert('シリアルポートが接続されていません');
    return;
  }
  const dataToSend = inputText.value + '\n';
  writeText(dataToSend);
}, false);

quickClrButton.addEventListener("click", function () {
  inputText.value = '?CLR';
}, false);

async function writeText(text) {
  const encoder = new TextEncoder();
  const writer = port.writable.getWriter();
  await writer.write(encoder.encode(text));
  console.log("テキスト書き込み: " + text);
  writer.releaseLock();
}
