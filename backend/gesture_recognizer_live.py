import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

# Path to the downloaded model
MODEL_PATH = "gesture_recognizer.task"

# Build the recognizer from the .task file
base_options = python.BaseOptions(model_asset_path=MODEL_PATH)
options = vision.GestureRecognizerOptions(base_options=base_options)
recognizer = vision.GestureRecognizer.create_from_options(options)

# Optional mapping from MediaPipe labels to friendly words
gesture_map = {
    "Thumb_Up": "Yes",
    "Thumb_Down": "No",
    "Open_Palm": "Hello",
    "Closed_Fist": "Thank you",
    "Victory": "Good job"
}

cap = cv2.VideoCapture(0)
print("🎥  Webcam started — press ESC to exit")

while cap.isOpened():
    success, frame = cap.read()
    if not success:
        continue

    frame = cv2.flip(frame, 1)
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
    result = recognizer.recognize(mp_image)

    label = "No gesture"
    if result.gestures:
        raw = result.gestures[0][0].category_name
        label = gesture_map.get(raw, raw)

    cv2.putText(frame, f"Gesture: {label}", (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
    cv2.imshow("Gesture Recognizer", frame)

    if cv2.waitKey(5) & 0xFF == 27:  # ESC to exit
        break

cap.release()
cv2.destroyAllWindows()
print("✅ Closed.")
