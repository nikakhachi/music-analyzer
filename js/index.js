const BACKGROUND_COLOR = { r: 50, g: 50, b: 50 };
const CANVAS_SIDE = 700;
const FREQUENCY_BINS = 1024;
const FREQUENCY_SMOOTHING = 0.1;

const canvasDoc = document.querySelector("canvas");
const playOrPauseButton = document.querySelector("#playOrPauseBtn");
const stopButton = document.querySelector("#stopBtn");
const ampButton = document.querySelector("#ampBtn");
const resetButton = document.querySelector("#resetBtn");
const songTitle = document.querySelector("#songTitle");
const buttonsDiv = document.querySelector("#buttons");
const uploaderButtons = document.querySelectorAll(".musicUploader");

buttonsDiv.style.display = "none";

let inputType;
let song;
let mic;
let amp;
let fft;
let volHistory = [];
let graphing = false;
let pause = true;
let circleNumbers = 0;
let graphAmps = true;

// Runs at the start, only once.
function setup() {
  createCanvas(CANVAS_SIDE, CANVAS_SIDE);
  colorMode(RGB);
  angleMode(DEGREES);
  amp = new p5.Amplitude();
  fft = new p5.FFT(FREQUENCY_SMOOTHING, FREQUENCY_BINS);
}

//  Runs everytime
function draw() {
  background(BACKGROUND_COLOR.r, BACKGROUND_COLOR.g, BACKGROUND_COLOR.b);
  if (graphing) {
    const isMicSelected = inputType === "mic";
    const spectrum = fft.analyze();
    // booleans below decide whether draw the spiral line or not
    if (!pause && (song?.isPlaying() || isMicSelected)) {
      let count = 0;
      spectrum.forEach((freq) => {
        count += freq;
      });
      const average = count / FREQUENCY_BINS;
      volHistory.push(average);
    }
    noFill();
    translate(width / 2, height / 2);
    beginShape();
    for (let i = 0; i < volHistory.length; i++) {
      const currentFrequency = volHistory[i];
      const { x: x1, y: y1 } = calculateCoordinates(i);
      stroke(255);
      vertex(x1, y1);
      // if (i + 1 !== volHistory.length) {
      //   const { x: x2, y: y2 } = calculateCoordinates(i + 1);
      //   stroke(map(currentFrequency, 0, 110, 50, 255), 100, 10);
      //   line(x2, y2, x1, y1);
      // }
    }
    endShape();
  }
}
async function handleSongSubmit() {
  const songFile = document.getElementById("musicUploaderInput").files[0];
  song = await loadSound(songFile, () => {
    songTitle.innerText = songFile.name.replace(".mp3", "");
    buttonsDiv.style.display = "flex";
    uploaderButtons.forEach((item) => item.classList.add("disabled"));
  });
}

function handleAmp() {
  graphAmps = !graphAmps;
}

function handlePlayOrPause() {
  if (inputType === "file") {
    if (song.isPlaying()) {
      pause = true;
      song.pause();
      playOrPauseButton.innerText = "Resume";
    } else {
      graphing = true;
      pause = false;
      song.play();
      playOrPauseButton.innerText = "Pause";
    }
  } else if (inputType === "mic") {
    if (pause === true) {
      mic.start();
      fft.setInput(mic);
      graphing = true;
      pause = false;
      playOrPauseButton.innerText = "Pause";
    } else {
      mic.stop();
      pause = true;
      playOrPauseButton.innerText = "Resume";
    }
  }
}

function handleStop() {
  graphing = false;
  pause = true;
  volHistory = [];
  song?.stop();
  playOrPauseButton.innerText = "Play";
}

function handleReset() {
  buttonsDiv.style.display = "none";
  uploaderButtons.forEach((item) => item.classList.remove("disabled"));
  mic?.stop();
  song?.stop();
  song = undefined;
  mic = undefined;
  amp = undefined;
  fft = undefined;
  inputType = undefined;
  graphing = false;
  pause = true;
  volHistory = [];
  songTitle.innerText = "";
  playOrPauseButton.innerText = "Start";
}

function handleInputTypeChange(type) {
  inputType = type;
  fft = new p5.FFT(FREQUENCY_SMOOTHING, FREQUENCY_BINS);
  if (type === "mic") {
    songTitle.innerText = "Microphone Selected";
    buttonsDiv.style.display = "flex";
    uploaderButtons.forEach((item) => item.classList.add("disabled"));
    mic = new p5.AudioIn();
  } else if (type === "file") {
    amp = new p5.Amplitude();
  }
}

function calculateCoordinates(i) {
  const currentFrequency = volHistory[i];
  const SPIRALING = height * 10;
  // With this settings, distance between spiral lines becomes
  // Shorter as spiral continues drawing
  const minRadius = height / (3 + i / SPIRALING);
  const maxRadius = height / (2 + i / SPIRALING) + CANVAS_SIDE / 6;
  stroke(250);
  strokeWeight(1);
  const r = map(
    graphAmps ? currentFrequency : 0,
    0,
    FREQUENCY_BINS,
    minRadius,
    maxRadius
  );
  const x = r * cos(i);
  const y = r * sin(i);
  return { x, y };
}
