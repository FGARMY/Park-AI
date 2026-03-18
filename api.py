from fastapi import FastAPI
import cv2
import threading
from detector import ParkingDetector

# ==============================
# CONFIG
# ==============================
VIDEO_PATH = "car-parking.mp4"
MODEL_PATH = "model/yolov8n.pt"
SLOT_FILE = "slots.json"

# ==============================
# INIT
# ==============================
app = FastAPI()
detector = ParkingDetector(MODEL_PATH, SLOT_FILE)
cap = cv2.VideoCapture(VIDEO_PATH)

latest_status = {
    "total": 0,
    "occupied": 0,
    "available": 0,
    "slots": []
}

# ==============================
# BACKGROUND LOOP
# ==============================
def update_loop():
    global latest_status

    while True:
        ret, frame = cap.read()

        if not ret:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            continue

        frame = cv2.resize(frame, (960, 540))

        cars = detector.detect(frame)
        slots = detector.check_slots(frame, cars)

        occupied = sum(1 for s in slots if s["occupied"])
        total = len(slots)

        latest_status = {
            "total": total,
            "occupied": occupied,
            "available": total - occupied,
            "slots": slots
        }

# Run detection in background thread
threading.Thread(target=update_loop, daemon=True).start()

# ==============================
# API ROUTES
# ==============================
@app.get("/")
def home():
    return {"message": "🚗 Parking Intelligence API Running"}

@app.get("/parking-status")
def get_status():
    return latest_status