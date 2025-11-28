document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    let width, height;
    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    let audioContext, micSource, analyser;
    let isRecording = false;
    const waveforms = []; // array of past waveform objects

    class CircularWaveform {
      constructor(dataArray, radius, color1, color2) {
        this.dataArray = dataArray; // Uint8Array frequency data snapshot
        this.radius = radius;       // base radius of the circle
        this.color1 = color1;       // gradient start color
        this.color2 = color2;       // gradient end color
      }

      draw() {
        const len = this.dataArray.length;
        const centerX = width/2;
        const centerY = height/2;

        ctx.beginPath();

        for(let i=0; i < len; i++) {
          let angle = (i / len) * Math.PI * 2;
          let amp = this.dataArray[i] / 255 * 100; // amplitude scaling

          // point on the circle perimeter plus amplitude
          let x = centerX + Math.cos(angle) * (this.radius + amp);
          let y = centerY + Math.sin(angle) * (this.radius + amp);

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.closePath();

        // create gradient stroke
        const grad = ctx.createRadialGradient(centerX, centerY, this.radius*0.8, centerX, centerY, this.radius+100);
        grad.addColorStop(0, this.color1);
        grad.addColorStop(1, this.color2);

        ctx.strokeStyle = grad;
        ctx.lineWidth = 4;
        ctx.stroke();
      }
    }

    async function startMic() {
      if(isRecording) return;

      if(!audioContext) {
        audioContext = new AudioContext();
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({audio:true});
        micSource = audioContext.createMediaStreamSource(stream);

        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        micSource.connect(analyser);

        isRecording = true;
        console.log("Mic started");
      } catch(e) {
        alert("Microphone permission denied or error: "+e.message);
      }
    }

    function stopMic() {
      if(!isRecording) return;

      // Grab a snapshot of the frequency data to store as a waveform
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);

      // Create a new waveform with a random radius and color palette
      const radius = 50 + waveforms.length * 30; // stagger rings outward
      const color1 = `hsl(${Math.random()*360}, 100%, 70%)`;
        const color2 = `hsl(${Math.random()*360}, 100%, 40%)`;

      waveforms.push(new CircularWaveform(dataArray, radius, color1, color2));

      if (micSource && micSource.mediaStream) {
        micSource.mediaStream.getTracks().forEach(track => track.stop());
      }
      if (micSource) {
        micSource.disconnect(analyser);
      }

      isRecording = false;
      console.log("Mic stopped - waveform saved");
    }

    function animate() {
      requestAnimationFrame(animate);

      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, width, height);

      if(isRecording && analyser) {
        // live waveform (pulse radius)
        const liveData = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(liveData);

        const liveRadius = 50 + waveforms.length * 30;
        const liveColor1 = `hsl(200, 100%, 70%)`;
        const liveColor2 = `hsl(340, 100%, 70%)`;

        const liveWaveform = new CircularWaveform(liveData, liveRadius, liveColor1, liveColor2);
        liveWaveform.draw();
      }

      // draw all saved waveforms
      for(let wf of waveforms) {
        wf.draw();
      }
    }

    animate(); // This can run outside DOMContentLoaded as it's purely canvas drawing

    // These need to be inside DOMContentLoaded
    document.getElementById("startBtn").onclick = startMic;
    document.getElementById("stopBtn").onclick = stopMic;

    async function saveWaveform() {
      // 1. Get email
      const emailInput = document.getElementById('email-input');
      const email = emailInput.value; // Get email, but don't validate for saving

      // 2. Get image data
      const imageDataURL = canvas.toDataURL('image/png');

      // 3. Trigger download
      const link = document.createElement('a');
      link.download = 'circular-waveform.png';
      link.href = imageDataURL;
      link.click();

      // 4. Save to database
      try {
        const response = await fetch('/api/save-waveform', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, imageData: imageDataURL }),
        });

        if (response.ok) {
          alert('Waveform saved to the gallery!');
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Server returned an error' }));
          alert(`Error saving waveform: ${errorData.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Failed to save waveform:', error);
        alert('An error occurred while trying to save your waveform. Is the server running?');
      }
    }
    document.getElementById("saveBtn").onclick = saveWaveform;

    async function sendWaveformToEmail() {
      const emailInput = document.getElementById('email-input');
      const email = emailInput.value;

      if (!email) {
        alert('Please enter your email address.');
        return;
      }

      const imageDataURL = canvas.toDataURL('image/png');
      
      const sendBtn = document.getElementById('send-btn');
      sendBtn.textContent = 'Sending...';
      sendBtn.disabled = true;

      try {
        const response = await fetch('/api/send-waveform', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            imageData: imageDataURL,
          }),
        });

        if (response.ok) {
          alert('Your waveform has been sent! Please check your email.');
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Server returned an error' }));
          alert(`Error sending waveform: ${errorData.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Failed to send waveform:', error);
        alert('An error occurred while trying to send your waveform. Is the server running?');
      } finally {
        sendBtn.textContent = 'Send to Email';
        sendBtn.disabled = false;
      }
    }
    document.getElementById('send-btn').onclick = sendWaveformToEmail;

    // --- NEW GALLERY JAVASCRIPT ---
    const galleryModal = document.getElementById('gallery-modal');
    const galleryGrid = document.getElementById('gallery-grid');
    const galleryBtn = document.getElementById('gallery-btn');
    const closeGalleryBtn = document.getElementById('close-gallery-btn');

    galleryBtn.onclick = async () => {
      galleryModal.classList.remove('hidden');
      await loadGallery();
    };

    closeGalleryBtn.onclick = () => {
      galleryModal.classList.add('hidden');
    };

    async function loadGallery() {
      galleryGrid.innerHTML = '<p style="color: #ccc;">Loading waveforms...</p>'; // Show loading message
      try {
        const response = await fetch('/api/waveforms');
        if (response.ok) {
          const { data } = await response.json();
          galleryGrid.innerHTML = ''; // Clear loading message

          if (data && data.length > 0) {
            data.forEach(wf => {
              const itemDiv = document.createElement('div');
              itemDiv.classList.add('gallery-item');

              const img = document.createElement('img');
              img.src = wf.imageData;
              img.alt = `Waveform from ${wf.email}`;

              const emailP = document.createElement('p');
              emailP.textContent = `Email: ${wf.email}`;

              const dateP = document.createElement('p');
              dateP.textContent = new Date(wf.createdAt).toLocaleString();

              itemDiv.appendChild(img);
              itemDiv.appendChild(emailP);
              itemDiv.appendChild(dateP);
              galleryGrid.appendChild(itemDiv);
            });
          } else {
            galleryGrid.innerHTML = '<p style="color: #ccc;">No waveforms saved yet.</p>';
          }
        } else {
          galleryGrid.innerHTML = '<p style="color: red;">Error loading waveforms.</p>';
        }
      } catch (error) {
        console.error('Failed to load gallery:', error);
        galleryGrid.innerHTML = '<p style="color: red;">Failed to connect to server to load waveforms.</p>';
      }
    }
    // --- END NEW GALLERY JAVASCRIPT ---
});