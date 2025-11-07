import React, { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import "./learnISL.css";

/**
 * LearnISL Component
 * Educational page for learning ISL gestures
 * Matches the new Samvaad design system with glassmorphism & gradients
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
    <div className="learn-isl-wrapper">
      {/* HEADER */}
      <section className="learn-header-section">
        <div className="learn-header-container">
          <h1 className="learn-title">📚 Learn Indian Sign Language</h1>
          <p className="learn-subtitle">Master ISL gestures with interactive practice and real-time feedback</p>
        </div>
      </section>

      {/* TABS */}
      <section className="learn-tabs-section">
        <div className="learn-tabs-container">
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
      </section>

      {/* CONTENT */}
      <section className="learn-content-section">
        {/* TAB 1: LIBRARY */}
        {activeTab === "library" && (
          <div className="learn-page">
            <div className="library-intro">
              <h2>Explore Our Gesture Collection</h2>
              <p>Search, filter, and learn from {filteredGestures.length} available gestures</p>
            </div>

            <div className="library-controls">
              <input
                type="text"
                className="library-search"
                placeholder="🔍 Search gestures... (e.g., 'Hello', 'धन्यवाद')"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="category-filters">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    className={`category-btn ${selectedCategory === cat ? "category-active" : ""}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="gestures-grid">
              {filteredGestures.length === 0 ? (
                <div className="empty-state">
                  <p>😕 No gestures found. Try a different search!</p>
                </div>
              ) : (
                filteredGestures.map((gesture) => (
                  <div key={gesture.id} className="gesture-card">
                    <div className="gesture-header">
                      <h3 className="gesture-name">{gesture.name}</h3>
                      <p className="gesture-hindi">{gesture.hindi}</p>
                    </div>

                    <div className="gesture-badges">
                      <span className={`badge difficulty-${gesture.difficulty.toLowerCase()}`}>
                        {gesture.difficulty}
                      </span>
                      <span className="badge category">{gesture.category}</span>
                    </div>

                    <p className="gesture-desc">{gesture.description}</p>

                    <div className="gesture-tips">
                      <strong>💡 How to perform:</strong>
                      <ul>
                        {gesture.tips.map((tip, idx) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    </div>

                    {gesture.similar_to.length > 0 && (
                      <div className="gesture-similar">
                        <strong>Similar:</strong> {gesture.similar_to.join(", ")}
                      </div>
                    )}

                    <div className="gesture-actions">
                      <button
                        className="btn-gesture-learn"
                        onClick={() => speak(`${gesture.name}. ${gesture.description}`, "en")}
                      >
                        🔊 Learn
                      </button>
                      <button className="btn-gesture-practice" onClick={() => startPractice(gesture)}>
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
          <div className="learn-page">
            {!showPracticeModal ? (
              <div className="practice-intro-box">
                <h2>🎯 Practice Mode</h2>
                <p>Learn by doing! Select a gesture from the library to start practicing.</p>
                <div className="practice-steps">
                  <div className="practice-step">
                    <div className="step-num">1</div>
                    <p><strong>Choose</strong> a gesture from the library</p>
                  </div>
                  <div className="practice-step">
                    <div className="step-num">2</div>
                    <p><strong>Read</strong> the description carefully</p>
                  </div>
                  <div className="practice-step">
                    <div className="step-num">3</div>
                    <p><strong>Perform</strong> the gesture in front of camera</p>
                  </div>
                  <div className="practice-step">
                    <div className="step-num">4</div>
                    <p><strong>Get</strong> real-time accuracy feedback</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="practice-session">
                <button className="btn-close-practice" onClick={() => setShowPracticeModal(false)}>
                  ✕ Close
                </button>

                <div className="practice-layout">
                  {/* CAMERA */}
                  <div className="practice-camera-area">
                    <div className="camera-header">
                      <h3>Your Camera</h3>
                      <span className={`practice-status ${practiceStatus}`}>
                        {practiceStatus === "ready" && "📍 Ready"}
                        {practiceStatus === "detecting" && "🔍 Detecting..."}
                        {practiceStatus === "success" && "✅ Great!"}
                        {practiceStatus === "fail" && "❌ Try Again"}
                      </span>
                    </div>

                    <div className="practice-camera-feed">
                      {isPracticeCameraOn ? (
                        <Webcam
                          ref={webcamRef}
                          screenshotFormat="image/jpeg"
                          className="practice-webcam"
                          videoConstraints={{ facingMode: "user", width: 640, height: 480 }}
                        />
                      ) : (
                        <div className="practice-camera-placeholder">
                          <div className="practice-camera-icon">📷</div>
                          <p>Camera is off</p>
                        </div>
                      )}
                    </div>

                    <button
                      className={`btn-camera-toggle ${isPracticeCameraOn ? "btn-camera-on" : ""}`}
                      onClick={() => setIsPracticeCameraOn((s) => !s)}
                    >
                      {isPracticeCameraOn ? "🎥 Stop Camera" : "📷 Start Camera"}
                    </button>
                  </div>

                  {/* FEEDBACK */}
                  <div className="practice-feedback-area">
                    <div className="practice-target-box">
                      <h3>Target Gesture</h3>
                      <div className="target-name">{selectedGesture?.name}</div>
                      <div className="target-hindi">{selectedGesture?.hindi}</div>
                      <p className="target-desc">{selectedGesture?.description}</p>

                      <div className="target-tips">
                        <strong>Remember:</strong>
                        <ul>
                          {selectedGesture?.tips.map((tip, idx) => (
                            <li key={idx}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="practice-feedback-box">
                      <h3>Your Performance</h3>

                      <div className="feedback-row">
                        <label>Detected:</label>
                        <div className="feedback-value">{practiceGesture || "—"}</div>
                      </div>

                      <div className="feedback-row">
                        <label>Accuracy:</label>
                        <div className="feedback-accuracy">{practiceAccuracy}%</div>
                      </div>

                      <div className="accuracy-bar-wrapper">
                        <div className="accuracy-bar-bg">
                          <div className="accuracy-bar-fill" style={{ width: `${practiceAccuracy}%` }} />
                        </div>
                      </div>

                      <div className="feedback-stats-grid">
                        <div className="feedback-stat"><strong>Attempts:</strong> {attemptCount}</div>
                        <div className="feedback-stat"><strong>Best:</strong> {bestAccuracy}%</div>
                      </div>

                      {practiceStatus === "success" && (
                        <div className="feedback-success">🎉 Perfect! Keep it up!</div>
                      )}
                      {practiceStatus === "fail" && attemptCount > 0 && (
                        <div className="feedback-fail">💪 Keep practicing!</div>
                      )}

                      <button
                        className="btn-practice-audio"
                        onClick={() => speak(selectedGesture?.description || "", "en")}
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
          <div className="learn-page">
            <h2 className="page-title">Your Learning Journey</h2>

            {/* STATS */}
            <div className="progress-stats-grid">
              <div className="progress-stat-card">
                <div className="stat-icon">🎓</div>
                <div className="stat-num">{userProgress.gestures_learned}/30</div>
                <div className="stat-label">Gestures Learned</div>
              </div>
              <div className="progress-stat-card">
                <div className="stat-icon">🏋️</div>
                <div className="stat-num">{userProgress.practice_sessions}</div>
                <div className="stat-label">Practice Sessions</div>
              </div>
              <div className="progress-stat-card">
                <div className="stat-icon">⭐</div>
                <div className="stat-num">Level {userProgress.current_level}</div>
                <div className="stat-label">Current Level</div>
              </div>
              <div className="progress-stat-card">
                <div className="stat-icon">🎯</div>
                <div className="stat-num">{userProgress.total_attempts}</div>
                <div className="stat-label">Total Attempts</div>
              </div>
            </div>

            {/* PROGRESS BAR */}
            <div className="progress-bar-section">
              <h3>Overall Progress</h3>
              <div className="progress-bar-container">
                <div className="progress-bar-background">
                  <div
                    className="progress-bar-indicator"
                    style={{ width: `${(userProgress.gestures_learned / 30) * 100}%` }}
                  />
                </div>
                <p className="progress-label">
                  {userProgress.gestures_learned} of 30 gestures mastered ({Math.round((userProgress.gestures_learned / 30) * 100)}%)
                </p>
              </div>
            </div>

            {/* ACHIEVEMENTS */}
            <div className="achievements-section">
              <h3>🏅 Achievements</h3>
              <div className="achievements-grid">
                {ACHIEVEMENTS.map((achievement) => {
                  const unlocked = userProgress.achievements.includes(achievement.id);
                  return (
                    <div key={achievement.id} className={`achievement-item ${unlocked ? "unlocked" : "locked"}`}>
                      <div className="achievement-icon">{achievement.icon}</div>
                      <h4>{achievement.name}</h4>
                      <p>{achievement.description}</p>
                      {unlocked && <span className="unlock-badge">✓</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RECOMMENDATIONS */}
            <div className="recommendations-section">
              <h3>💡 What's Next?</h3>
              <div className="recommendations-grid">
                <div className="rec-item">
                  <p><strong>🎯 Next Goal:</strong> Master 2 more gestures to level up!</p>
                </div>
                <div className="rec-item">
                  <p><strong>📚 Try Learning:</strong> Relations category (Family, Friend) next</p>
                </div>
                <div className="rec-item">
                  <p><strong>⚡ Daily Challenge:</strong> Practice one gesture for 10 minutes</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}