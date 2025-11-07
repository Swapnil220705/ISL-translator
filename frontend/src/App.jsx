import React, { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";

const App = () => {
  const webcamRef = useRef(null);
  const [gesture, setGesture] = useState("");
  const [translationEn, setTranslationEn] = useState("");
  const [translationHi, setTranslationHi] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Capture frame and send to backend
  const captureFrame = useCallback(async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    try {
      const res = await fetch("http://localhost:5000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageSrc }),
      });
      const data = await res.json();

      if (data.gesture) {
        setGesture(data.gesture);
        setTranslationEn(data.translation_en);
        setTranslationHi(data.translation_hi);

        // Optional: Speak English translation
        if (!isSpeaking) {
          const utter = new SpeechSynthesisUtterance(data.translation_en);
          utter.lang = "en-IN";
          utter.onend = () => setIsSpeaking(false);
          setIsSpeaking(true);
          window.speechSynthesis.speak(utter);
        }
      }
    } catch (err) {
      console.error("Error:", err);
    }
  }, [isSpeaking]);

  // Auto capture every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      captureFrame();
    }, 2000);
    return () => clearInterval(interval);
  }, [captureFrame]);

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>🖐️ ISL Real-Time Translator</h1>
      <Webcam
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        style={{
          width: "60%",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        }}
      />
      <div style={{ marginTop: "20px" }}>
        <h2>Gesture: {gesture || "Detecting..."}</h2>
        <h3>English: {translationEn}</h3>
        <h3>Hindi: {translationHi}</h3>
      </div>
    </div>
  );
};

export default App;
