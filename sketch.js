<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Audio Visualizer</title>

  <style>
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
  </style>
</head>
<body>

  <div id="controls">
    <button id="startBtn">Start Mic</button>
    <button id="stopBtn">Stop Mic</button>
  </div>

  <!-- YOU WERE MISSING THIS -->
  <canvas id="canvas"></canvas>

  <script src="script.js"></script>
</body>
</html>
