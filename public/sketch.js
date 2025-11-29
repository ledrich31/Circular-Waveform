// This file was HTML but saved as .js; replace it with JS that creates the same DOM so the file parses correctly.

(function () {
  // set document title and meta
  document.title = "Audio Visualizer";
  const meta = document.createElement("meta");
  meta.name = "viewport";
  meta.content = "width=device-width, initial-scale=1.0";
  document.head.appendChild(meta);

  // styles
  const style = document.createElement("style");
  style.textContent = `
    body {
      margin: 0;
      overflow: hidden;
      background: black;
    }

    #controls {
      position: fixed;
      top: 20px;
      left: 20px;
      display: flex;
      gap: 12px;
      z-index: 9999;
    }

    button {
      background: #222;
      color: white;
      padding: 10px 18px;
      border: 2px solid #fff;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
    }

    button:hover {
      background: #444;
    }
  `;
  document.head.appendChild(style);

  // controls container
  const controls = document.createElement("div");
  controls.id = "controls";

  const startBtn = document.createElement("button");
  startBtn.id = "startBtn";
  startBtn.textContent = "Start Mic";

  const stopBtn = document.createElement("button");
  stopBtn.id = "stopBtn";
  stopBtn.textContent = "Stop Mic";

  controls.appendChild(startBtn);
  controls.appendChild(stopBtn);
  document.body.appendChild(controls);

  // canvas
  const canvas = document.createElement("canvas");
  canvas.id = "canvas";
  document.body.appendChild(canvas);

  // optionally load external script.js if needed
  // const script = document.createElement("script");
  // script.src = "script.js";
  // document.body.appendChild(script);
})();
