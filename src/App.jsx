import { useEffect, useRef, useState } from 'react';
import { createWorker } from 'tesseract.js';
import Cropper from 'react-cropper';

import "cropperjs/dist/cropper.css";

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

const worker = createWorker({
  logger: (m) => console.log(m),
});

export default function App() {
  const [imagePath, setImagePath] = useState('');
  const [text, setText] = useState('');
  const [rotateDeg, setRotateDeg] = useState(0);
  const cropper = useRef(null);

  const handleChange = async (event) => {
    setImagePath(URL.createObjectURL(event.target.files[0]));
    // const imgNativeBase64 = await toBase64(event.target.files[0]);
    // const [,base64Content] = imgNativeBase64.split(',');

    // console.log(await toBase64(event.target.files[0]));
  };

  useEffect(async () => {
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    // const {
    //   data: { text },
    // } = await worker.recognize(
    //   'https://tesseract.projectnaptha.com/img/eng_bw.png'
    // );
    // console.log(text);
    // await worker.terminate();
  }, []);

  const handleClick = async () => {
    const {
      data: { text },
    } = await worker.recognize(imagePath);
    console.log(text);
    // Tesseract.recognize(imagePath, 'eng', {
    //   logger: (m) => console.log(m),
    // })
    //   .catch((err) => {
    //     console.error(err);
    //   })
    //   .then((result) => {
    //     // Get Confidence score
    //     let confidence = result.confidence;

    //     let text = result.text;
    //     setText(text);
    //   });
  };

  const handleCropChange = () => {
    console.log("## cropped !");
    const croppedImgData = cropper.current.cropper
      .getCroppedCanvas()
      .toDataURL();
    // console.log(croppedImgData);
  }

  const handleRotateChange = e => {
    setRotateDeg(e.target.value);
    cropper.current.cropper.rotateTo(e.target.value);
  }

  const finalizeCropper = () => {
    setImagePath(cropper.current.cropper.getCroppedCanvas().toDataURL());
  };

  const resetCropper = () => {
    cropper.current.cropper.reset();
    cropper.current.cropper.clear();
  };

  const getText = () => {
    const base64Content = cropper.current.cropper.getCroppedCanvas().toDataURL();
    const [,content] = base64Content.split(',');
    const gapiClient = gapi.client
      .request({
        path: 'https://vision.googleapis.com/v1/images:annotate',
        method: 'POST',
        body: {
          requests: [
            {
              image: {
                content,
              },
              features: [
                {
                  model: 'builtin/latest',
                  type: 'TEXT_DETECTION',
                },
              ],
            },
          ],
        },
      })
      .then((resp) => {
        console.log(resp);
      });
  };

  return (
    <div className='App'>
      <input type='file' onchange={handleChange} />
      <br />
      <input type="range" min="0" max="359" style={{ width: 500 }} value={rotateDeg} onChange={handleRotateChange} />
      <Cropper
        style={{ maxWidth: "600px", height: "400px" }}
        ref={cropper}
        src={imagePath}
        autoCrop={false}
        cropend={handleCropChange}
      />
      <button onClick={finalizeCropper}>Finalize</button>
      <button onClick={resetCropper}>Reset</button>
      <button onClick={getText}>Get text</button>
      {/* <button onClick={handleClick} style={{ height: 50 }}>
        {' '}
        convert to text
      </button>
      <h3>Extracted text</h3>
      <div className='text-box'>
        <p> {text} </p>
      </div> */}
    </div>
  );
}
