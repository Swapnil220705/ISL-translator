import React, { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import "../App.css"; // reuse your existing styling

export default function HomePage() {
  const webcamRef = useRef(null);

  // --- UI States ---
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [language, setLanguage] = useState("en");
  const [speakEnabled, setSpeakEnabled] = useState(true);
  const [ttsPanelEnabled, setTtsPanelEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // --- Translation States ---
  const [gesture, setGesture] = useState("");
  const [translationEn, setTranslationEn] = useState("");
  const [translationHi, setTranslationHi] = useState("");

  // --- Context-Aware States ---
  const [contextEn, setContextEn] = useState("");
  const [contextHi, setContextHi] = useState("");
  const [lastContextGesture, setLastContextGesture] = useState("");

  // --- Recents ---
  const [recentTranslations, setRecentTranslations] = useState([]);

  // --- Contact ---
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });

  // --- TTS Helper ---
  const speak = useCallback((text, lang = "en") => {
    if (!text || isSpeaking) return;
    try {
      window.speechSynthesis.cancel();
    } catch {}
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang === "en" ? "en-IN" : "hi-IN";
    utter.rate = 1.0;
    utter.pitch = 1.0;
    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    try {
      window.speechSynthesis.speak(utter);
    } catch (err) {
      console.warn("TTS error:", err);
      setIsSpeaking(false);
    }
  }, [isSpeaking]);

  // --- Context Translation Trigger ---
  const triggerContextTranslate = useCallback(async (gestureText) => {
    if (!gestureText || gestureText === "No gesture" || gestureText === lastContextGesture) return;
    setLastContextGesture(gestureText);
    const t0 = performance.now();
    try {
      const res = await fetch("http://localhost:5000/context-translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gesture: gestureText }),
      });
      const data = await res.json();
      const latency = Math.round(performance.now() - t0);

      const eng = data.english_sentence || data.refined || data.english || data.en || "";
      const hi = data.hindi_translation || data.hi || data.hindi || "";

      if (eng) setContextEn(eng);
      if (hi) setContextHi(hi);

      console.log(`🧠 /context-translate latency: ${latency}ms`);

      if (speakEnabled && ttsPanelEnabled && eng) {
        const toSpeak = language === "en" ? eng : hi || eng;
        if (toSpeak && toSpeak !== contextEn) speak(toSpeak, language);
      }

      setRecentTranslations((prev) => {
        if (prev.length === 0) return prev;
        const updated = [...prev];
        if (updated[0].raw === gestureText) {
          updated[0] = { ...updated[0], refined: eng || updated[0].refined, hi: hi || updated[0].hi };
        }
        return updated;
      });
    } catch (err) {
      console.warn("❌ Error in /context-translate:", err);
    }
  }, [lastContextGesture, speakEnabled, ttsPanelEnabled, speak, language, contextEn]);

  // --- Capture Frame ---
  const captureFrame = useCallback(async () => {
    if (!webcamRef.current || !isCameraOn) return;
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
      console.log(`⚡ /predict latency: ${latency}ms`);

      if (!data.gesture || data.gesture === "No gesture") return;

      const rawLabel = data.gesture;
      const en = data.translation_en || rawLabel;
      const hi = data.translation_hi || "";

      setGesture(rawLabel);
      setTranslationEn(en);
      setTranslationHi(hi);

      const newItem = {
        id: Date.now(),
        raw: rawLabel,
        refined: en,
        hi,
        ts: new Date().toLocaleTimeString(),
      };
      setRecentTranslations((prev) => [newItem, ...prev].slice(0, 10));

      triggerContextTranslate(rawLabel);
    } catch (err) {
      console.error("❌ Error in /predict:", err);
    }
  }, [isCameraOn, triggerContextTranslate]);

  // --- Auto-capture loop ---
  useEffect(() => {
    if (!isCameraOn) return;
    const interval = setInterval(captureFrame, 1200);
    return () => clearInterval(interval);
  }, [isCameraOn, captureFrame]);

  // --- Helpers ---
  const playAudio = (text, lang = "en") => speak(text, lang);
  const handleContactSubmit = (e) => {
    e.preventDefault();
    alert("Message sent (demo)");
    setContactForm({ name: "", email: "", message: "" });
  };

  return (
    <>
      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-header">
          <h2 className="hero-title">Samvaad – Breaking Barriers Through AI</h2>
          <p className="hero-subtitle">Real-time Indian Sign Language Translation (Context-Aware)</p>
        </div>

        <div className="hero-dashboard">
          {/* LEFT: CAMERA */}
          <div className="camera-section">
            <div className="camera-status-bar">
              <span className={`status-dot ${isCameraOn ? "status-live" : "status-off"}`} />
              <span className="status-text">{isCameraOn ? "Live — Translating" : "Camera Off"}</span>
            </div>
            <div className="camera-feed">
              {isCameraOn ? (
                <Webcam
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="webcam"
                  videoConstraints={{ facingMode: "user", width: 640, height: 480 }}
                />
              ) : (
                <div className="camera-placeholder">
                  <div className="camera-placeholder-icon">🤟</div>
                  <p>Turn camera on to begin translating</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: OUTPUT */}
          <div className="output-section">
            <div className="output-card">
              <select className="select-language" value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="en">English</option>
                <option value="hi">हिंदी (Hindi)</option>
              </select>

              <div className="output-block">
                <label className="output-label">RAW TRANSLATION</label>
                <div className="output-raw">{gesture || "Waiting for gesture..."}</div>
              </div>

              <div className="output-divider" />

              <div className="output-block">
                <label className="output-label">Context-Aware</label>
                <div className="output-refined">
                  {language === "en"
                    ? contextEn || translationEn || "Context building..."
                    : contextHi || translationHi || "अनुवाद यहाँ दिखाई देगा..."}
                </div>
              </div>

              <div className="output-controls">
                <button className="btn-primary" onClick={() => setIsCameraOn((s) => !s)}>
                  {isCameraOn ? "Cam: ON" : "Cam: OFF"}
                </button>
                <button
                  className={`tts-toggle ${ttsPanelEnabled ? "tts-on" : "tts-off"}`}
                  onClick={() => setTtsPanelEnabled((s) => !s)}
                >
                  {ttsPanelEnabled ? "🔊 TTS On" : "🔇 Off"}
                </button>
                <button
                  className="btn-play-output"
                  onClick={() =>
                    playAudio(language === "en" ? contextEn || translationEn : contextHi || translationHi, language)
                  }
                  disabled={!(contextEn || translationEn || contextHi || translationHi)}
                >
                  🔈 Play
                </button>
              </div>

              <div className="output-meta">Lang: {language.toUpperCase()} • Model: Context-Aware + Vision</div>
            </div>
          </div>
        </div>
      </section>

      {/* RECENT TRANSLATIONS */}
      <section id="recent" className="recent-section">
        <h2 className="section-title">Recent Translations</h2>
        <div className="recent-scroll">
          {recentTranslations.length === 0 ? (
            <div className="empty-state"><p>No recent translations yet — turn camera on to start.</p></div>
          ) : (
            recentTranslations.map((item) => (
              <div key={item.id} className="recent-card">
                <div className="recent-emoji">🖐</div>
                <div className="recent-text">
                  <p className="recent-raw">{item.raw}</p>
                  <p className="recent-refined">{item.refined}</p>
                  <span className="recent-time">{item.ts}</span>
                </div>
                <button className="btn-play-small" onClick={() => playAudio(item.refined, "en")}>🔊</button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="how-section">
        <h2 className="section-title">How It Works</h2>
        <div className="how-cards">
          <div className="how-card">
            <div className="how-icon">🖐</div>
            <h3>Capture Sign Gesture</h3>
            <p>Camera interprets ISL hand movements in real-time.</p>
          </div>
          <div className="how-card">
            <div className="how-icon">🌐</div>
            <h3>AI Understands Context</h3>
            <p>Context-aware model refines grammar and tone for natural sentences.</p>
          </div>
          <div className="how-card">
            <div className="how-icon">💬</div>
            <h3>Translate Instantly</h3>
            <p>Outputs multilingual text & speech instantly.</p>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="contact-section">
        <h2 className="section-title">Get In Touch</h2>
        <div className="contact-container">
          <div className="contact-info">
            <h3>Contact Information</h3>
            <p>📧 team@samvaad.ai</p>
            <p>🐙 github.com/samvaad</p>
          </div>

          <form className="contact-form" onSubmit={handleContactSubmit}>
            <input type="text" placeholder="Your Name" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} />
            <input type="email" placeholder="Your Email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} />
            <textarea placeholder="Your Message" value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} rows={5} />
            <button type="submit" className="btn-primary">Send Message</button>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-brand">
            <h3>Samvaad</h3>
            <p>Breaking Barriers Through AI</p>
          </div>
          <div className="footer-links">
            <a href="#how-it-works">How It Works</a>
            <a href="#recent">Recent</a>
            <a href="#contact">Contact</a>
          </div>
          <div className="footer-social">
            <a href="https://github.com/samvaad" target="_blank" rel="noopener noreferrer">🐙</a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">🔗</a>
            <a href="mailto:team@samvaad.ai">✉️</a>
          </div>
        </div>
        <div className="footer-copyright">
          <p>© 2025 Samvaad. Built with ❤️ by Team Elevate.</p>
        </div>
      </footer>
    </>
  );
}
