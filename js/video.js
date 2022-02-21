const videoElement = document.getElementById('video');
const canvas = document.getElementById('canvas');

const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const blurBtn = document.getElementById('blur-btn');
const unblurBtn = document.getElementById('unblur-btn');

const ctx = canvas.getContext('2d');

//
// const input = document.getElementById('file-input');
// const videoSource = document.createElement('source');

const mobileAndTabletCheck = navigator.userAgentData.mobile;

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

// input.addEventListener('change', function() {
//   unblurBtn.disabled = true;
//   blurBtn.disabled = false;
//
//   unblurBtn.hidden = true;
//   blurBtn.hidden = false;
//
//   const files = this.files || [];
//
//   if (!files.length) return;
//
//   const reader = new FileReader();
//
//   reader.onload = function (e) {
//     videoSource.setAttribute('src', e.target.result);
//     videoElement.appendChild(videoSource);
//     videoElement.load();
//     videoElement.play();
//   };
//
//   reader.onprogress = function (e) {
//     console.log('progress: ', Math.round((e.loaded * 100) / e.total));
//   };
//
//   reader.readAsDataURL(files[0]);
// });

videoElement.onplaying = () => {
  canvas.height = videoElement.videoHeight;
  canvas.width = videoElement.videoWidth;
};

const videoInput = document.getElementById('vid-file-picker');
var isLocalFile = false;
videoInput.addEventListener('change', e => {
  // startBtn.disabled = true;
  // stopBtn.disabled = false;

  unblurBtn.disabled = false;
  blurBtn.disabled = false;
  isLocalFile = true;
  playLocalVideoFile();
}, false);

function playLocalVideoFile(evt) {
  // let videoEl = document.getElementById('local-vid');
  const file = videoInput.files[0];
  const type = file.type;
  if (!videoElement.canPlayType(type)) {
    alert('cannot play that file');
    return;
  }
  // videoElement.src = URL.createObjectURL(file);
  videoElement.src = URL.createObjectURL(file);
  videoElement.play().then(() => {
    // Mozilla currently prefixes the function name, so we have to check for either
    if (typeof videoElement.mozCaptureStream == 'function') {
      window.localVideoStream = videoElement.mozCaptureStream();
    } else if (typeof videoElement.captureStream == 'function') {
      window.localVideoStream = videoElement.captureStream();
    }
  });
}

function startVideoStream() {

  navigator.mediaDevices.getUserMedia({video: true, audio: false})
    .then(stream => {
      isLocalFile = false;
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

  if (stream != null){
    stream.getTracks().forEach(track => track.stop());

    videoElement.srcObject = null;
  }

  // const stream2 = videoElement.src;
  //
  // if(stream2 != null){
  //   URL.revokeObjectURL(link.href);
  //
  //   videoElement.src = null;
  // }
}

function loadBodyPix() {
  options = {
    architecture: 'ResNet50',
    outputStride: 32,
    quantBytes: 2
  }

  if (mobileAndTabletCheck){
    options = {
      architecture: 'MobileNetV1',
      outputStride: 16,
      multiplier: 0.75,
      quantBytes: 2
    }
  }
  bodyPix.load(options)
    .then(net => perform(net))
    .catch(err => console.log(err))
}

async function perform(net) {

  // while (startBtn.disabled && blurBtn.hidden){
  while (blurBtn.hidden){
    const net = await bodyPix.load();
    // 1 way

    // const partSegmentation = await net.segmentMultiPersonParts(videoElement);
    const faceBodyPartIdsToBlur = [0, 1];
    const flipHorizontal = true;
    let partSegmentation;
    let backgroundBlurAmount;
    let edgeBlurAmount;

    if(isLocalFile){
      partSegmentation = await net.segmentPersonParts(videoElement, {
        flipHorizontal: false,
        internalResolution: 'high',
        segmentationThreshold: 0.4
      });

      backgroundBlurAmount = 3;
      edgeBlurAmount = 3;

    }else{
      partSegmentation = await net.segmentPersonParts(videoElement, {
        flipHorizontal: false,
        internalResolution: 'medium',
        segmentationThreshold: 0.7
      });

      backgroundBlurAmount = 10;
      edgeBlurAmount = 10;
    }

    bodyPix.blurBodyPart(
        canvas, videoElement, partSegmentation, faceBodyPartIdsToBlur,
        backgroundBlurAmount, edgeBlurAmount, flipHorizontal);

    // 2 way
    // Load the model.
    // const model = await blazeface.load();
    //
    // // Pass in an image or video to the model. The model returns an array of
    // // bounding boxes, probabilities, and landmarks, one for each detected face.
    //
    // const returnTensors = false; // Pass in `true` to get tensors back, rather than values.
    // const predictions = await model.estimateFaces(videoElement, returnTensors);
    //
    // if (predictions.length > 0) {
    //   /*
    //   `predictions` is an array of objects describing each detected face, for example:
    //
    //   [
    //     {
    //       topLeft: [232.28, 145.26],
    //       bottomRight: [449.75, 308.36],
    //       probability: [0.998],
    //       landmarks: [
    //         [295.13, 177.64], // right eye
    //         [382.32, 175.56], // left eye
    //         [341.18, 205.03], // nose
    //         [345.12, 250.61], // mouth
    //         [252.76, 211.37], // right ear
    //         [431.20, 204.93] // left ear
    //       ]
    //     }
    //   ]
    //   */
    //
    //   for (let i = 0; i < predictions.length; i++) {
    //     const start = predictions[i].topLeft;
    //     const end = predictions[i].bottomRight;
    //     const size = [end[0] - start[0], end[1] - start[1]];
    //
    //     // Render a rectangle over each detected face.
    //     ctx.fillRect(start[0], start[1], size[0], size[1]);
    //   }
    // }
  }
}
