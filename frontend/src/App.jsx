import React, { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";

const App = () => {
  const webcamRef = useRef(null);
  const [gesture, setGesture] = useState("");
  const [translationEn, setTranslationEn] = useState("");
  const [translationHi, setTranslationHi] = useState("");
  const [contextEn, setContextEn] = useState("");
  const [contextHi, setContextHi] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastContextGesture, setLastContextGesture] = useState("");

  // ✅ Speak helper — queues speech safely
  const speak = useCallback((text) => {
    if (!text || isSpeaking) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-IN";
    utter.rate = 1.0;
    utter.pitch = 1;
    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utter);
  }, [isSpeaking]);

  // ✅ Capture frame & send to backend
  const captureFrame = useCallback(async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    const t0 = performance.now();
    try {
      const res = await fetch("http://localhost:5000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageSrc }),
      });
      const data = await res.json();
      const latency = Math.round(performance.now() - t0);

      // Only update if response is valid
      if (data.gesture) {
        setGesture(data.gesture);
        setTranslationEn(data.translation_en);
        setTranslationHi(data.translation_hi);

        // Speak the English translation (only if not repeating same word)
        if (data.translation_en && data.translation_en !== translationEn) {
          speak(data.translation_en);
        }

        // Trigger context translation only if gesture changed significantly
        if (data.gesture !== lastContextGesture) {
          setLastContextGesture(data.gesture);
          triggerContextTranslate(data.gesture);
        }
      }

      console.log(`⚡ /predict latency: ${latency}ms`);
    } catch (err) {
      console.error("❌ Error in /predict:", err);
    }
  }, [translationEn, lastContextGesture, speak]);

  // ✅ Trigger context translation (with debounce)
  const triggerContextTranslate = useCallback(async (gesture) => {
    if (!gesture || gesture === "No gesture") return;

    const t0 = performance.now();
    try {
      const res = await fetch("http://localhost:5000/context-translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gesture }),
      });
      const data = await res.json();
      const latency = Math.round(performance.now() - t0);

      if (data.english_sentence) {
        setContextEn(data.english_sentence);
        setContextHi(data.hindi_translation);
        console.log("🧠 Context:", data.english_sentence, `(${latency}ms)`);

        // Speak only if sentence is new
        if (data.english_sentence !== contextEn) {
          speak(data.english_sentence);
        }
      }
    } catch (err) {
      console.error("❌ Error in /context-translate:", err);
    }
  }, [contextEn, speak]);

  // ✅ Continuous capture loop every ~1.2 seconds (instead of 2s)
  useEffect(() => {
    const interval = setInterval(() => {
      captureFrame();
    }, 1200); // slightly faster but still safe
    return () => clearInterval(interval);
  }, [captureFrame]);

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>🖐️ ISL Real-Time Translator (Optimized)</h1>

      <Webcam
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        style={{
          width: "60%",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        }}
        videoConstraints={{
          facingMode: "user",
          width: 640,
          height: 480,
        }}
      />

      <div style={{ marginTop: "20px" }}>
        <h2>Gesture: {gesture || "Detecting..."}</h2>
        <h3>English: {translationEn}</h3>
        <h3>Hindi: {translationHi}</h3>
      </div>

      <div
        style={{
          marginTop: "30px",
          padding: "10px",
          borderTop: "1px solid #ddd",
        }}
      >
        <h2>🧠 Context-Aware Translation</h2>
        <h3>English: {contextEn || "Building context..."}</h3>
        <h3>Hindi: {contextHi || ""}</h3>
      </div>
    </div>
  );
};

export default App;
