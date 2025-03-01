import { useRef } from "react";
import * as cam from "@mediapipe/camera_utils";
import JS2Py from "../remotepyjs";
import { useDispatch, useSelector } from "react-redux";
import {
  setTrainingStatusOff,
  setTrainingStatusOn,
} from "../app/features/trainerSlice";
import useMessageApi from "./useMessageApi";
import { setIsSpeaking, setSpeakText } from "../app/features/speechSlice";
import {
  setIsModelLoading,
  setIsRecording,
} from "../app/features/converterSlice";

function useHolisticModel1() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const { contextHolder, showMessage } = useMessageApi();

  const dispatch = useDispatch();

  const { modelId } = useSelector((state) => state.model);
  const { concept } = useSelector((state) => state.model);
  const { isModelLoading } = useSelector((state) => state.converter);

  const mpHolistic = window;
  const drawingUtils = window;

  const connect = window.drawConnectors;
  var camera = null;

  let activeEffect = "mask";

  const onResults = (results) => {
    console.log("onresults", isModelLoading);

    dispatch(setIsModelLoading(false));

    sendToServer(results);

    const videoWidth = webcamRef.current.video.videoWidth;
    const videoHeight = webcamRef.current.video.videoHeight;

    // set canvas width and height
    canvasRef.current.width = videoWidth;
    canvasRef.current.height = videoHeight;

    const canvasElement = canvasRef.current;

    const canvasCtx = canvasElement.getContext("2d");
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(
      results.image,
      0,
      0,
      canvasElement.width,
      canvasElement.height
    );

    if (results.segmentationMask) {
      canvasCtx.drawImage(
        results.segmentationMask,
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );

      // Only overwrite existing pixels.
      if (activeEffect === "mask" || activeEffect === "both") {
        canvasCtx.globalCompositeOperation = "source-in";
        // This can be a color or a texture or whatever...
        canvasCtx.fillStyle = "#00FF007F";
        canvasCtx.fillRect(
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
      } else {
        canvasCtx.globalCompositeOperation = "source-out";
        canvasCtx.fillStyle = "#0000FF7F";
        canvasCtx.fillRect(
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
      }

      // Only overwrite missing pixels.
      canvasCtx.globalCompositeOperation = "destination-atop";
      canvasRef.current &&
        canvasCtx.drawImage(
          results.image,
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );

      canvasCtx.globalCompositeOperation = "source-over";
    } else {
      canvasRef.current &&
        canvasCtx.drawImage(
          results.image,
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
    }

    // Connect elbows to hands. Do this first so that the other graphics will draw
    // on top of these marks.
    canvasCtx.lineWidth = 5;
    if (results.poseLandmarks) {
      if (results.rightHandLandmarks) {
        canvasCtx.strokeStyle = "white";
        connect(canvasCtx, [
          [
            results.poseLandmarks[mpHolistic.POSE_LANDMARKS.RIGHT_ELBOW],
            results.rightHandLandmarks[0],
          ],
        ]);
      }
      if (results.leftHandLandmarks) {
        canvasCtx.strokeStyle = "white";
        connect(canvasCtx, [
          [
            results.poseLandmarks[mpHolistic.POSE_LANDMARKS.LEFT_ELBOW],
            results.leftHandLandmarks[0],
          ],
        ]);
      }
    }

    // Pose...
    drawingUtils.drawConnectors(
      canvasCtx,
      results?.poseLandmarks,
      mpHolistic.POSE_CONNECTIONS,
      { color: "white" }
    );
    drawingUtils.drawLandmarks(
      canvasCtx,
      Object.values(mpHolistic.POSE_LANDMARKS_LEFT).map(
        (index) => results?.poseLandmarks && results?.poseLandmarks[index]
      ),
      {
        visibilityMin: 0.65,
        color: "white",
        fillColor: "rgb(255,138,0)",
      }
    );
    drawingUtils.drawLandmarks(
      canvasCtx,
      Object.values(mpHolistic.POSE_LANDMARKS_RIGHT).map(
        (index) => results?.poseLandmarks && results?.poseLandmarks[index]
      ),
      {
        visibilityMin: 0.65,
        color: "white",
        fillColor: "rgb(0,217,231)",
      }
    );

    // Hands...
    drawingUtils.drawConnectors(
      canvasCtx,
      results.rightHandLandmarks,
      mpHolistic.HAND_CONNECTIONS,
      { color: "white" }
    );
    drawingUtils.drawLandmarks(canvasCtx, results.rightHandLandmarks, {
      color: "white",
      fillColor: "rgb(0,217,231)",
      lineWidth: 2,
      radius: (data) => {
        return drawingUtils.lerp(data.from.z, -0.15, 0.1, 10, 1);
      },
    });
    drawingUtils.drawConnectors(
      canvasCtx,
      results.leftHandLandmarks,
      mpHolistic.HAND_CONNECTIONS,
      { color: "white" }
    );
    drawingUtils.drawLandmarks(canvasCtx, results.leftHandLandmarks, {
      color: "white",
      fillColor: "rgb(255,138,0)",
      lineWidth: 2,
      radius: (data) => {
        return drawingUtils.lerp(data.from.z, -0.15, 0.1, 10, 1);
      },
    });

    // Face...
    drawingUtils.drawConnectors(
      canvasCtx,
      results.faceLandmarks,
      mpHolistic.FACEMESH_TESSELATION,
      { color: "#C0C0C070", lineWidth: 1 }
    );
    drawingUtils.drawConnectors(
      canvasCtx,
      results.faceLandmarks,
      mpHolistic.FACEMESH_RIGHT_EYE,
      { color: "rgb(0,217,231)" }
    );
    drawingUtils.drawConnectors(
      canvasCtx,
      results.faceLandmarks,
      mpHolistic.FACEMESH_RIGHT_EYEBROW,
      { color: "rgb(0,217,231)" }
    );
    drawingUtils.drawConnectors(
      canvasCtx,
      results.faceLandmarks,
      mpHolistic.FACEMESH_LEFT_EYE,
      { color: "rgb(255,138,0)" }
    );
    drawingUtils.drawConnectors(
      canvasCtx,
      results.faceLandmarks,
      mpHolistic.FACEMESH_LEFT_EYEBROW,
      { color: "rgb(255,138,0)" }
    );
    drawingUtils.drawConnectors(
      canvasCtx,
      results.faceLandmarks,
      mpHolistic.FACEMESH_FACE_OVAL,
      { color: "#E0E0E0", lineWidth: 5 }
    );
    drawingUtils.drawConnectors(
      canvasCtx,
      results.faceLandmarks,
      mpHolistic.FACEMESH_LIPS,
      { color: "#E0E0E0", lineWidth: 5 }
    );

    canvasCtx.restore();
  };

  // useEffect(() => {
  const startHolisticModel = () => {
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null
    ) {
      const holistic = new mpHolistic.Holistic({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
        },
      });

      holistic.setOptions({
        selfieMode: true,
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
        effect: "background",
      });

      // holistic.initialize();

      holistic.onResults(onResults);

      console.log(holistic);

      camera = new cam.Camera(webcamRef.current.video, {
        onFrame: async () => {
          await holistic.send({ image: webcamRef.current.video });
        },
        // width: 200,
        // height: 200,
      });
      camera.start();
    }
  };

  const sendToServer = (data) => {
    const page = window.location.pathname;

    if (page === "/trainer/collect") {
      JS2Py.PythonFunctions.TalkMotionServer.collectGetstureAndConcept(
        modelId,
        data,
        Date.now(),
        concept,
        function (res) {
          console.log(res);
          if (res == -1) {
            dispatch(setTrainingStatusOff());
          } else if (res == 0) {
            dispatch(setTrainingStatusOn());
          } else if (res == 1) {
            showMessage("success", "sample collected");
          }
        }
      );
    } else if (page === "/converter") {
      JS2Py.PythonFunctions.TalkMotionServer.translateGestureToWords(
        data,
        Date.now(),
        modelId,
        function (res) {
          console.log(res);
          if (res.status == -1) {
            dispatch(setIsRecording(false));
            dispatch(setIsSpeaking(false));
          } else if (res.status == 0) {
            dispatch(setIsRecording(true));
            dispatch(setIsSpeaking(false));
          } else {
            dispatch(setIsSpeaking(true));
            dispatch(setSpeakText(res.prediction));
          }
        }
      );
    }
  };

  return {
    webcamRef,
    audioRef,
    canvasRef,
    startHolisticModel,
    contextHolder,
    showMessage,
  };
}

export default useHolisticModel1;
