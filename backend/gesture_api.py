from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from deep_translator import GoogleTranslator
import base64
from collections import deque
from groq import Groq
import os
from dotenv import load_dotenv

# ============================================================
# ⚙ Load environment variables
# ============================================================
load_dotenv()

# ============================================================
# 🚀 Initialize Groq Client (Ultra-Fast LLaMA 3.1 Inference)
# ============================================================
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY)

# Keep a short-term context for gestures
recent_gestures = deque(maxlen=5)

# Flask app setup
app = Flask(_name_)
CORS(app)

# ============================================================
# 🖐 Load Gesture Recognition Model (MediaPipe)
# ============================================================
MODEL_PATH = "gesture_recognizer.task"
base_options = python.BaseOptions(model_asset_path=MODEL_PATH)
options = vision.GestureRecognizerOptions(base_options=base_options)
recognizer = vision.GestureRecognizer.create_from_options(options)

# Gesture label mapping
gesture_map = {
    "Thumb_Up": "Yes",
    "Thumb_Down": "No",
    "Open_Palm": "Hello",
    "Closed_Fist": "Thank you",
    "Victory": "Good job"
}

# ============================================================
# 🔍 /predict — Real-time Gesture Detection
# ============================================================
@app.route('/predict', methods=['POST'])
def predict_gesture():
    try:
        data = request.get_json()
        image_b64 = data.get("image")

        if not image_b64:
            return jsonify({"error": "No image data"}), 400

        # Decode base64 image
        image_data = base64.b64decode(image_b64.split(",")[-1])
        nparr = np.frombuffer(image_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        frame = cv2.flip(frame, 1)
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # Recognize gesture
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        result = recognizer.recognize(mp_image)

        label = "No gesture"
        if result.gestures:
            raw = result.gestures[0][0].category_name
            label = gesture_map.get(raw, raw)

        # Translate to Hindi using Deep Translator
        translation_hi = GoogleTranslator(source='en', target='hi').translate(label)

        return jsonify({
            "gesture": label,
            "translation_en": label,
            "translation_hi": translation_hi
        })

    except Exception as e:
        print("❌ Error in /predict:", e)
        return jsonify({"error": str(e)}), 500


# ============================================================
# 🧠 /context-translate — Context-Aware Sentence Generation
# ============================================================
@app.route('/context-translate', methods=['POST'])
def context_translate():
    try:
        data = request.get_json()
        gesture = data.get("gesture")

        if not gesture or gesture == "No gesture":
            return jsonify({"message": "Waiting for valid gesture"}), 200

        recent_gestures.append(gesture)
        print("🧠 Current context:", list(recent_gestures))

        prompt = (
            f"You are an Indian Sign Language (ISL) translator.\n"
            f"These gestures were detected in sequence: {list(recent_gestures)}.\n"
            f"Write a short, natural English sentence (under 15 words) that expresses their meaning clearly.\n"
            f"Only output the sentence text."
        )

        # ⚡ Super-fast generation via Groq (LLaMA 3.1)
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=50,
            top_p=1.0,
        )

        english_sentence = completion.choices[0].message.content.strip()
        print("🗣 English Sentence:", english_sentence)

        # Translate to Hindi using Deep Translator
        translation_hi = GoogleTranslator(source='en', target='hi').translate(english_sentence)

        return jsonify({
            "context_gestures": list(recent_gestures),
            "english_sentence": english_sentence,
            "hindi_translation": translation_hi
        })

    except Exception as e:
        print("❌ Error in /context-translate:", e)
        return jsonify({"error": str(e)}), 500


# ============================================================
# ❤ Health Check Endpoint
# ============================================================
@app.route('/health')
def health():
    return jsonify({"status": "OK"})


# ============================================================
# 🚀 Run Server
# ============================================================
if _name_ == '_main_':
    app.run(debug=True, host='0.0.0.0', port=5000)