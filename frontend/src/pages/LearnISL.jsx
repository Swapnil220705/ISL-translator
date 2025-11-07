import React, { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import "./learnISL.css";

/**
 * LearnISL Component
 * Educational page for learning ISL gestures
 * Reuses App.css styling - minimal CSS override only
 */

export default function LearnISL() {
  const webcamRef = useRef(null);

  // ==================== UI States ====================
  const [activeTab, setActiveTab] = useState("library");
  const [isPracticeCameraOn, setIsPracticeCameraOn] = useState(false);
  const [selectedGesture, setSelectedGesture] = useState(null);
  const [showPracticeModal, setShowPracticeModal] = useState(false);

  // ==================== Practice Mode States ====================
  const [practiceGesture, setPracticeGesture] = useState("");
  const [practiceAccuracy, setPracticeAccuracy] = useState(0);
  const [practiceStatus, setPracticeStatus] = useState("ready");
  const [attemptCount, setAttemptCount] = useState(0);
  const [bestAccuracy, setBestAccuracy] = useState(0);

  // ==================== Progress States ====================
  const [userProgress, setUserProgress] = useState({
    gestures_learned: 8,
    practice_sessions: 3,
    total_attempts: 24,
    achievements: [1],
    current_level: 1,
  });

  // ==================== ISL Gesture Library ====================
  const ISL_GESTURES = [
    {
      id: 1,
      name: "Hello",
      hindi: "नमस्ते",
      category: "Greetings",
      difficulty: "Easy",
      description: "Wave your hand from side to side at shoulder height",
      tips: ["Keep palm open", "Smooth wave motion", "Maintain shoulder height"],
      similar_to: ["Hi", "Goodbye"],
    },
    {
      id: 2,
      name: "Thank You",
      hindi: "धन्यवाद",
      category: "Courtesy",
      difficulty: "Easy",
      description: "Bring fingers to your lips, then move hand outward and downward",
      tips: ["Fingers touch lips first", "Smooth outward motion", "End with open palm"],
      similar_to: ["Appreciate", "Gratitude"],
    },
    {
      id: 3,
      name: "Yes",
      hindi: "हाँ",
      category: "Responses",
      difficulty: "Easy",
      description: "Nod your head and move fist up and down",
      tips: ["Closed fist", "Vertical movement", "Confident nod"],
      similar_to: ["Agree", "Confirm"],
    },
    {
      id: 4,
      name: "No",
      hindi: "नहीं",
      category: "Responses",
      difficulty: "Easy",
      description: "Shake your head and move index finger left to right",
      tips: ["Index finger extended", "Side to side motion", "Strong head shake"],
      similar_to: ["Disagree", "Reject"],
    },
    {
      id: 5,
      name: "Help",
      hindi: "मदद",
      category: "Requests",
      difficulty: "Medium",
      description: "Place one palm on the other hand's fist and raise both",
      tips: ["Palm on fist", "Upward movement", "Both hands engaged"],
      similar_to: ["Support", "Assist"],
    },
    {
      id: 6,
      name: "Happy",
      hindi: "खुश",
      category: "Emotions",
      difficulty: "Easy",
      description: "Make a smile with fingers, move upward on face",
      tips: ["Smile while signing", "Upward hand motion", "Positive expression"],
      similar_to: ["Smile", "Joy"],
    },
    {
      id: 7,
      name: "Sad",
      hindi: "दुःख",
      category: "Emotions",
      difficulty: "Easy",
      description: "Make a frown with fingers, move downward on face",
      tips: ["Sad facial expression", "Downward motion", "Slower movement"],
      similar_to: ["Cry", "Grief"],
    },
    {
      id: 8,
      name: "Good",
      hindi: "अच्छा",
      category: "Descriptions",
      difficulty: "Easy",
      description: "Thumb up or bring fingers from mouth outward",
      tips: ["Confident gesture", "Open hand position"],
      similar_to: ["Excellent", "Great"],
    },
    {
      id: 9,
      name: "Bad",
      hindi: "बुरा",
      category: "Descriptions",
      difficulty: "Easy",
      description: "Thumb down or push hand down with frown",
      tips: ["Negative expression", "Downward motion"],
      similar_to: ["Terrible", "Poor"],
    },
    {
      id: 10,
      name: "Water",
      hindi: "पानी",
      category: "Objects",
      difficulty: "Medium",
      description: "Make 'W' shape with hand near mouth, move down",
      tips: ["Three fingers extended", "Mouth level start", "Smooth downward flow"],
      similar_to: ["Drink", "Liquid"],
    },
    {
      id: 11,
      name: "Family",
      hindi: "परिवार",
      category: "Relations",
      difficulty: "Medium",
      description: "Two 'F' hands circle around face and body",
      tips: ["Both hands moving", "Circular motion", "Around body"],
      similar_to: ["Group", "Home"],
    },
    {
      id: 12,
      name: "Friend",
      hindi: "दोस्त",
      category: "Relations",
      difficulty: "Easy",
      description: "Hook index fingers together",
      tips: ["Both hands engaged", "Connected fingers", "Friendly expression"],
      similar_to: ["Companion", "Buddy"],
    },
  ];

  // ==================== Achievements ====================
  const ACHIEVEMENTS = [
    { id: 1, name: "First Step", description: "Learn your first gesture", icon: "🎯" },
    { id: 2, name: "Practice Master", description: "Complete 5 practice sessions", icon: "🏆" },
    { id: 3, name: "Accuracy Expert", description: "Achieve 90%+ accuracy on any gesture", icon: "🎖️" },
    { id: 4, name: "Speed Runner", description: "Learn 5 gestures in one day", icon: "⚡" },
    { id: 5, name: "Perfect Score", description: "Get 100% accuracy on 3 different gestures", icon: "💯" },
  ];

  // ==================== TTS Helper ====================
  const speak = useCallback((text, lang = "en") => {
    try {
      window.speechSynthesis.cancel();
    } catch {}
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang === "en" ? "en-IN" : "hi-IN";
    utter.rate = 0.9;
    utter.pitch = 1.0;
    try {
      window.speechSynthesis.speak(utter);
    } catch (err) {
      console.warn("TTS error:", err);
    }
  }, []);

  // ==================== Practice Mode Logic ====================
  const startPractice = useCallback((gesture) => {
    setSelectedGesture(gesture);
    setShowPracticeModal(true);
    setPracticeGesture("");
    setPracticeAccuracy(0);
    setPracticeStatus("ready");
    setAttemptCount(0);
    setBestAccuracy(0);
  }, []);

  const capturePracticeFrame = useCallback(async () => {
    if (!webcamRef.current || !isPracticeCameraOn) return;
    if (practiceStatus !== "ready") return;

    setPracticeStatus("detecting");
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    try {
      const res = await fetch("http://localhost:5000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageSrc }),
      });
      const data = await res.json();

      if (!data.gesture || data.gesture === "No gesture") {
        setPracticeStatus("fail");
        setTimeout(() => setPracticeStatus("ready"), 1500);
        return;
      }

      const detectedGesture = data.gesture.toLowerCase();
      const targetGesture = selectedGesture.name.toLowerCase();
      const accuracy =
        detectedGesture === targetGesture
          ? 100
          : detectedGesture.includes(targetGesture) || targetGesture.includes(detectedGesture)
          ? 75
          : 0;

      setPracticeGesture(detectedGesture);
      setPracticeAccuracy(accuracy);
      setAttemptCount((prev) => prev + 1);

      if (accuracy >= 75) {
        setPracticeStatus("success");
        if (accuracy > bestAccuracy) setBestAccuracy(accuracy);

        if (accuracy === 100) {
          setUserProgress((prev) => ({
            ...prev,
            gestures_learned: Math.min(prev.gestures_learned + 1, 30),
            total_attempts: prev.total_attempts + 1,
          }));
        }

        setTimeout(() => {
          setPracticeStatus("ready");
          setPracticeGesture("");
        }, 2000);
      } else {
        setPracticeStatus("fail");
        setTimeout(() => setPracticeStatus("ready"), 1500);
      }
    } catch (err) {
      console.error("Practice prediction error:", err);
      setPracticeStatus("fail");
      setTimeout(() => setPracticeStatus("ready"), 1500);
    }
  }, [isPracticeCameraOn, practiceStatus, selectedGesture]);

  useEffect(() => {
    if (!isPracticeCameraOn || practiceStatus !== "ready") return;
    const interval = setInterval(capturePracticeFrame, 800);
    return () => clearInterval(interval);
  }, [isPracticeCameraOn, practiceStatus, capturePracticeFrame]);

  // ==================== Filter & Search ====================
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", ...new Set(ISL_GESTURES.map((g) => g.category))];

  const filteredGestures = ISL_GESTURES.filter((gesture) => {
    const matchesSearch =
      gesture.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gesture.hindi.includes(searchTerm) ||
      gesture.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || gesture.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // ==================== Render Component ====================
  return (
    <div className="learn-wrapper">
      {/* HEADER - Using hero-header pattern */}
      <section className="hero">
        <div className="hero-header">
          <h2 className="hero-title">📚 Learn Indian Sign Language</h2>
          <p className="hero-subtitle">Master ISL gestures with interactive practice and real-time feedback</p>
        </div>

        {/* TABS - Using section-title pattern for styling */}
        <div className="learn-tabs">
          <button
            className={`learn-tab-btn ${activeTab === "library" ? "learn-tab-active" : ""}`}
            onClick={() => setActiveTab("library")}
          >
            📖 Gesture Library
          </button>
          <button
            className={`learn-tab-btn ${activeTab === "practice" ? "learn-tab-active" : ""}`}
            onClick={() => setActiveTab("practice")}
          >
            🎯 Practice Mode
          </button>
          <button
            className={`learn-tab-btn ${activeTab === "progress" ? "learn-tab-active" : ""}`}
            onClick={() => setActiveTab("progress")}
          >
            📊 My Progress
          </button>
        </div>

        {/* TAB 1: LIBRARY */}
        {activeTab === "library" && (
          <div className="learn-content">
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <p style={{ fontSize: "1.1rem", color: "#64748B" }}>
                Search, filter, and learn from {filteredGestures.length} available gestures
              </p>
            </div>

            <div className="learn-controls">
              <input
                type="text"
                className="select-language"
                placeholder="🔍 Search gestures... (e.g., 'Hello', 'धन्यवाद')"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ flex: 1, minWidth: "250px" }}
              />
              <div className="learn-categories">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    className={`learn-category-btn ${selectedCategory === cat ? "learn-category-active" : ""}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="how-cards">
              {filteredGestures.length === 0 ? (
                <div className="empty-state">
                  <p>😕 No gestures found. Try a different search!</p>
                </div>
              ) : (
                filteredGestures.map((gesture) => (
                  <div key={gesture.id} className="how-card">
                    <div style={{ textAlign: "left", marginBottom: "1rem" }}>
                      <h3 style={{ margin: 0, fontSize: "1.3rem", color: "#1B6EEB" }}>
                        {gesture.name}
                      </h3>
                      <p style={{ margin: "0.25rem 0 0 0", color: "#64748B", fontWeight: 500 }}>
                        {gesture.hindi}
                      </p>
                    </div>

                    <div className="learn-badges">
                      <span className={`learn-badge difficulty-${gesture.difficulty.toLowerCase()}`}>
                        {gesture.difficulty}
                      </span>
                      <span className="learn-badge category">{gesture.category}</span>
                    </div>

                    <p style={{ fontSize: "0.95rem", color: "#475569", lineHeight: "1.6", margin: 0 }}>
                      {gesture.description}
                    </p>

                    <div className="learn-tips">
                      <strong style={{ color: "#1B6EEB" }}>💡 How to perform:</strong>
                      <ul style={{ margin: "0.5rem 0 0 1.5rem", paddingLeft: 0, fontSize: "0.85rem", color: "#475569" }}>
                        {gesture.tips.map((tip, idx) => (
                          <li key={idx} style={{ marginBottom: "0.25rem" }}>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {gesture.similar_to.length > 0 && (
                      <p style={{ fontSize: "0.85rem", color: "#64748B", margin: "0.5rem 0 0 0" }}>
                        <strong style={{ color: "#1B6EEB" }}>Similar:</strong> {gesture.similar_to.join(", ")}
                      </p>
                    )}

                    <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                      <button
                        className="btn-primary"
                        onClick={() => speak(`${gesture.name}. ${gesture.description}`, "en")}
                        style={{ flex: 1, padding: "0.75rem 1rem", fontSize: "0.9rem" }}
                      >
                        🔊 Learn
                      </button>
                      <button
                        className="btn-primary"
                        onClick={() => startPractice(gesture)}
                        style={{ flex: 1, padding: "0.75rem 1rem", fontSize: "0.9rem" }}
                      >
                        🎯 Practice
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PRACTICE */}
        {activeTab === "practice" && (
          <div className="learn-content">
            {!showPracticeModal ? (
              <div className="how-card" style={{ textAlign: "center", padding: "3rem 2rem" }}>
                <h2 className="hero-title" style={{ margin: "0 0 1rem 0", fontSize: "2rem" }}>
                  🎯 Practice Mode
                </h2>
                <p className="hero-subtitle" style={{ margin: "0 0 2rem 0" }}>
                  Learn by doing! Select a gesture from the library to start practicing.
                </p>
                <div className="how-cards">
                  <div className="how-card" style={{ textAlign: "center" }}>
                    <div className="how-icon">1️⃣</div>
                    <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#111827" }}>Choose</h3>
                    <p style={{ fontSize: "0.9rem", color: "#64748B", margin: 0 }}>Select a gesture from the library</p>
                  </div>
                  <div className="how-card" style={{ textAlign: "center" }}>
                    <div className="how-icon">2️⃣</div>
                    <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#111827" }}>Read</h3>
                    <p style={{ fontSize: "0.9rem", color: "#64748B", margin: 0 }}>Read the description carefully</p>
                  </div>
                  <div className="how-card" style={{ textAlign: "center" }}>
                    <div className="how-icon">3️⃣</div>
                    <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#111827" }}>Perform</h3>
                    <p style={{ fontSize: "0.9rem", color: "#64748B", margin: 0 }}>Perform the gesture in front of camera</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="camera-section" style={{ padding: "2rem", position: "relative" }}>
                <button
                  onClick={() => setShowPracticeModal(false)}
                  style={{
                    position: "absolute",
                    top: "1rem",
                    right: "1rem",
                    background: "rgba(27, 110, 235, 0.1)",
                    border: "1px solid rgba(27, 110, 235, 0.2)",
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    fontSize: "1.2rem",
                    cursor: "pointer",
                    color: "#1B6EEB",
                    fontWeight: "bold",
                  }}
                >
                  ✕
                </button>

                <div className="hero-dashboard">
                  {/* CAMERA */}
                  <div>
                    <div className="camera-status-bar">
                      <span className={`status-dot ${practiceStatus === "success" ? "status-live" : practiceStatus === "fail" ? "status-off" : "status-live"}`} />
                      <span className="status-text">
                        {practiceStatus === "ready" && "📍 Ready"}
                        {practiceStatus === "detecting" && "🔍 Detecting..."}
                        {practiceStatus === "success" && "✅ Great!"}
                        {practiceStatus === "fail" && "❌ Try Again"}
                      </span>
                    </div>

                    <div className="camera-feed">
                      {isPracticeCameraOn ? (
                        <Webcam
                          ref={webcamRef}
                          screenshotFormat="image/jpeg"
                          className="webcam"
                          videoConstraints={{ facingMode: "user", width: 640, height: 480 }}
                        />
                      ) : (
                        <div className="camera-placeholder">
                          <div className="camera-placeholder-icon">📷</div>
                          <p>Camera is off</p>
                        </div>
                      )}
                    </div>

                    <button
                      className="btn-primary"
                      onClick={() => setIsPracticeCameraOn((s) => !s)}
                      style={{ width: "100%", marginTop: "1rem" }}
                    >
                      {isPracticeCameraOn ? "🎥 Stop Camera" : "📷 Start Camera"}
                    </button>
                  </div>

                  {/* FEEDBACK */}
                  <div className="output-section">
                    <div className="output-card">
                      <div className="output-block">
                        <label className="output-label">Target Gesture</label>
                        <div className="output-raw" style={{ color: "#1B6EEB", textAlign: "center", fontSize: "1.4rem" }}>
                          {selectedGesture?.name}
                        </div>
                        <div style={{ fontSize: "1rem", color: "#64748B", textAlign: "center" }}>
                          {selectedGesture?.hindi}
                        </div>
                      </div>

                      <p style={{ fontSize: "0.95rem", color: "#475569", lineHeight: "1.6", margin: 0 }}>
                        {selectedGesture?.description}
                      </p>

                      <div className="learn-tips">
                        <strong style={{ color: "#1B6EEB" }}>Remember:</strong>
                        <ul style={{ margin: "0.5rem 0 0 1.5rem", paddingLeft: 0, fontSize: "0.85rem", color: "#475569" }}>
                          {selectedGesture?.tips.map((tip, idx) => (
                            <li key={idx} style={{ marginBottom: "0.25rem" }}>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="output-divider" />

                      <div className="output-block">
                        <label className="output-label">Your Performance</label>
                        <div className="output-raw">
                          Accuracy: {practiceAccuracy}% | Attempts: {attemptCount} | Best: {bestAccuracy}%
                        </div>
                      </div>

                      <div style={{ width: "100%", height: "8px", background: "rgba(100, 116, 139, 0.1)", borderRadius: "10px", overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            background: "linear-gradient(90deg, #1B6EEB, #06B6D4)",
                            width: `${practiceAccuracy}%`,
                            transition: "width 0.5s ease",
                          }}
                        />
                      </div>

                      {practiceStatus === "success" && (
                        <p style={{ color: "#059669", textAlign: "center", fontWeight: "600", margin: "1rem 0 0 0" }}>
                          🎉 Perfect! Keep it up!
                        </p>
                      )}
                      {practiceStatus === "fail" && attemptCount > 0 && (
                        <p style={{ color: "#dc2626", textAlign: "center", fontWeight: "600", margin: "1rem 0 0 0" }}>
                          💪 Keep practicing!
                        </p>
                      )}

                      <button
                        className="btn-play-output"
                        onClick={() => speak(selectedGesture?.description || "", "en")}
                        style={{ marginTop: "1rem" }}
                      >
                        🔊 Hear Instructions
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PROGRESS */}
        {activeTab === "progress" && (
          <div className="learn-content">
            <h2 className="section-title" style={{ fontSize: "2rem", marginBottom: "2rem" }}>
              Your Learning Journey
            </h2>

            <div className="how-cards">
              <div className="how-card" style={{ textAlign: "center" }}>
                <div className="how-icon">🎓</div>
                <h3 style={{ fontSize: "1.6rem", color: "#1B6EEB", fontWeight: 700, margin: 0 }}>
                  {userProgress.gestures_learned}/30
                </h3>
                <p style={{ fontSize: "0.9rem", color: "#64748B", margin: "0.5rem 0 0 0" }}>
                  Gestures Learned
                </p>
              </div>
              <div className="how-card" style={{ textAlign: "center" }}>
                <div className="how-icon">🏋️</div>
                <h3 style={{ fontSize: "1.6rem", color: "#1B6EEB", fontWeight: 700, margin: 0 }}>
                  {userProgress.practice_sessions}
                </h3>
                <p style={{ fontSize: "0.9rem", color: "#64748B", margin: "0.5rem 0 0 0" }}>
                  Practice Sessions
                </p>
              </div>
              <div className="how-card" style={{ textAlign: "center" }}>
                <div className="how-icon">⭐</div>
                <h3 style={{ fontSize: "1.6rem", color: "#1B6EEB", fontWeight: 700, margin: 0 }}>
                  Level {userProgress.current_level}
                </h3>
                <p style={{ fontSize: "0.9rem", color: "#64748B", margin: "0.5rem 0 0 0" }}>
                  Current Level
                </p>
              </div>
            </div>

            <div className="output-card" style={{ marginTop: "2rem" }}>
              <label className="output-label">Progress Bar</label>
              <div style={{ width: "100%", height: "20px", background: "rgba(100, 116, 139, 0.1)", borderRadius: "10px", overflow: "hidden", marginBottom: "1rem" }}>
                <div
                  style={{
                    height: "100%",
                    background: "linear-gradient(90deg, #1B6EEB, #06B6D4)",
                    width: `${(userProgress.gestures_learned / 30) * 100}%`,
                    transition: "width 0.5s ease",
                  }}
                />
              </div>
              <p style={{ fontSize: "0.9rem", color: "#64748B", margin: 0 }}>
                {userProgress.gestures_learned} of 30 gestures mastered ({Math.round((userProgress.gestures_learned / 30) * 100)}%)
              </p>
            </div>

            <h2 className="section-title" style={{ fontSize: "1.5rem", marginTop: "2rem", marginBottom: "1rem" }}>
              🏅 Achievements
            </h2>
            <div className="how-cards">
              {ACHIEVEMENTS.map((achievement) => {
                const unlocked = userProgress.achievements.includes(achievement.id);
                return (
                  <div key={achievement.id} className="how-card" style={{ opacity: unlocked ? 1 : 0.5, textAlign: "center" }}>
                    <div className="how-icon">{achievement.icon}</div>
                    <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#111827", margin: 0 }}>
                      {achievement.name}
                    </h3>
                    <p style={{ fontSize: "0.85rem", color: "#64748B", margin: "0.5rem 0 0 0" }}>
                      {achievement.description}
                    </p>
                    {unlocked && (
                      <span style={{ fontSize: "0.8rem", color: "#FFD700", fontWeight: 700, marginTop: "0.5rem", display: "block" }}>
                        ✓ Unlocked
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}