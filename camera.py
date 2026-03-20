import cv2
import threading
import time
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from detector import ParkingDetector

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

detector = ParkingDetector("slots.json")

latest_frame = None
latest_status = {"total": 0, "occupied": 0, "available": 0, "slots": []}
lock = threading.Lock()

def capture_loop():
    global latest_frame, latest_status
    cap = cv2.VideoCapture("car-parking.mp4")
    while True:
        ret, frame = cap.read()
        if not ret:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            continue
        frame = cv2.resize(frame, (960, 540))
        slots = detector.check_slots(frame)
        occupied = sum(1 for s in slots if s["occupied"])
        total = len(slots)
        with lock:
            latest_frame = frame.copy()
            latest_status = {
                "total": total,
                "occupied": occupied,
                "available": total - occupied,
                "slots": slots
            }
        time.sleep(0.033)

threading.Thread(target=capture_loop, daemon=True).start()

def generate_frames():
    while True:
        with lock:
            frame = latest_frame
        if frame is None:
            time.sleep(0.1)
            continue
        _, buffer = cv2.imencode('.jpg', frame)
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' +
               buffer.tobytes() + b'\r\n')
        time.sleep(0.033)

@app.get("/")
def home():
    return {"message": "ParkIQ Running"}

@app.get("/parking-status")
def get_status():
    return latest_status

@app.get("/video-feed")
def video_feed():
    return StreamingResponse(generate_frames(), media_type="multipart/x-mixed-replace;boundary=frame")