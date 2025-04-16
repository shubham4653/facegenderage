let video = document.getElementById('webcam');
let canvas = document.getElementById('canvas');
let startButton = document.getElementById('start-button');
let loadingIndicator = document.getElementById('loading-indicator');

// Show loading indicator while models load
async function loadModels() {
  loadingIndicator.style.display = 'block';
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri('https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights/ssd_mobilenetv1_model-weights_manifest.json'),
    faceapi.nets.faceLandmark68Net.loadFromUri('https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights/face_landmark_68_model-weights_manifest.json'),
    faceapi.nets.faceRecognitionNet.loadFromUri('https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights/face_recognition_model-weights_manifest.json'),
    faceapi.nets.ageGenderNet.loadFromUri('https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights/age_gender_model-weights_manifest.json')
  ]);
  loadingIndicator.style.display = 'none';
  console.log("Models loaded successfully");
}

loadModels();

// Start webcam
async function startWebcam() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    video.onloadedmetadata = () => {
      console.log("Webcam feed is ready.");
    };
    video.play();
    console.log("Webcam is streaming...");
  } catch (error) {
    console.error("Error accessing webcam: ", error);
  }
}

// Start detection
startButton.addEventListener('click', () => {
  startButton.disabled = true;
  startWebcam();
  detectFaces();
});

async function detectFaces() {
  const displaySize = { width: video.width, height: video.height };
  canvas.width = displaySize.width;
  canvas.height = displaySize.height;
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.SsdMobilenetv1Options())
      .withFaceLandmarks()
      .withAgeAndGender();

    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Fix offset by translating context 50px left before drawing
    context.save();
    context.translate(0, 0);

    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

    context.restore();

    resizedDetections.forEach(detection => {
      const { age, gender, genderProbability } = detection;
      const ageText = `Age: ${Math.round(age)} years`;
      const genderText = `Gender: ${gender} (${(genderProbability * 100).toFixed(1)}%)`;

      const box = detection.detection.box;
      const x = box.x ; // Adjust x by -50px to fix offset
      const y = box.y;

      context.font = "16px Arial";
      context.fillStyle = "white";
      context.strokeStyle = "#ff6347";
      context.lineWidth = 2;
      context.fillText(ageText, x + 5, y - 10);
      context.strokeText(ageText, x + 5, y - 10);
      context.fillText(genderText, x + 5, y + box.height + 20);
      context.strokeText(genderText, x + 5, y + box.height + 20);
    });
  }, 100);
}
