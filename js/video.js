const videoElement = document.getElementById('video');
const canvas = document.getElementById('canvas');

const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const blurBtn = document.getElementById('blur-btn');
const unblurBtn = document.getElementById('unblur-btn');

const ctx = canvas.getContext('2d');

//
const input = document.getElementById('file-input');
const videoSource = document.createElement('source');

startBtn.addEventListener('click', e => {
  startBtn.disabled = true;
  stopBtn.disabled = false;

  unblurBtn.disabled = false;
  blurBtn.disabled = false;

  startVideoStream();
});

stopBtn.addEventListener('click', e => {
  startBtn.disabled = false;
  stopBtn.disabled = true;

  unblurBtn.disabled = true;
  blurBtn.disabled = true;

  unblurBtn.hidden = true;
  blurBtn.hidden = false;

  videoElement.hidden = false;
  canvas.hidden = true;

  stopVideoStream();
});

blurBtn.addEventListener('click', e => {
  blurBtn.hidden = true;
  unblurBtn.hidden = false;

  videoElement.hidden = true;
  canvas.hidden = false;

  loadBodyPix();
});

unblurBtn.addEventListener('click', e => {
  blurBtn.hidden = false;
  unblurBtn.hidden = true;

  videoElement.hidden = false;
  canvas.hidden = true;
});

//

input.addEventListener('change', function() {
  unblurBtn.disabled = true;
  blurBtn.disabled = false;

  unblurBtn.hidden = true;
  blurBtn.hidden = false;

  const files = this.files || [];

  if (!files.length) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    videoSource.setAttribute('src', e.target.result);
    videoElement.appendChild(videoSource);
    videoElement.load();
    videoElement.play();
  };

  reader.onprogress = function (e) {
    console.log('progress: ', Math.round((e.loaded * 100) / e.total));
  };

  reader.readAsDataURL(files[0]);
});

videoElement.onplaying = () => {
  canvas.height = videoElement.videoHeight;
  canvas.width = videoElement.videoWidth;
};

function startVideoStream() {
  navigator.mediaDevices.getUserMedia({video: true, audio: false})
    .then(stream => {
      videoElement.srcObject = stream;
      videoElement.play();
    })
    .catch(err => {
      startBtn.disabled = false;
      blurBtn.disabled = true;
      stopBtn.disabled = true;
      alert(`Following error occurred: ${err}`);
    });
}

function stopVideoStream() {
  const stream = videoElement.srcObject;

  stream.getTracks().forEach(track => track.stop());
  videoElement.srcObject = null;
}

function loadBodyPix() {
  options = {
    multiplier: 0.75,
    stride: 32,
    quantBytes: 4
  }
  bodyPix.load(options)
    .then(net => perform(net))
    .catch(err => console.log(err))
}

async function perform(net) {

  while ((startBtn.disabled && blurBtn.hidden) || (blurBtn.disabled)){
    const net = await bodyPix.load();
    const partSegmentation = await net.segmentMultiPersonParts(videoElement);

    const backgroundBlurAmount = 20;
    const edgeBlurAmount = 20;
    const flipHorizontal = true;
    const faceBodyPartIdsToBlur = [0, 1];

    bodyPix.blurBodyPart(
        canvas, videoElement, partSegmentation, faceBodyPartIdsToBlur,
        backgroundBlurAmount, edgeBlurAmount, flipHorizontal);
  }
}
