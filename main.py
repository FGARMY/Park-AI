import cv2
from detector import ParkingDetector

# ==============================
# CONFIG
# ==============================
IMAGE_PATH = "image-car.jpg"
VIDEO_PATH = "car-parking.mp4"   # your video file
MODEL_PATH = "model/yolov8n.pt"  # or yolov8s.pt for better accuracy
SLOT_FILE = "slots.json"

# ==============================
# INITIALIZE
# ==============================
detector = ParkingDetector(MODEL_PATH, SLOT_FILE)
cap = cv2.VideoCapture(VIDEO_PATH)

if not cap.isOpened():
    print("❌ Error: Could not open video.")
    exit()

# ==============================
# MAIN LOOP
# ==============================
while True:
    ret, frame = cap.read()

    if not ret:
        print("✅ Video ended or error reading frame.")
        break

    # Resize for performance (optional)
    frame = cv2.resize(frame, (960, 540))

    # ==============================
    # DETECTION
    # ==============================
    cars = detector.detect(frame)

    # ==============================
    # SLOT CHECK
    # ==============================
    slots = detector.check_slots(frame, cars)

    # ==============================
    # COUNTING
    # ==============================
    occupied = sum(1 for s in slots if s["occupied"])
    total = len(slots)
    available = total - occupied

    # ==============================
    # DISPLAY INFO
    # ==============================
    cv2.putText(frame, f"Total: {total}", (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

    cv2.putText(frame, f"Occupied: {occupied}", (20, 80),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)

    cv2.putText(frame, f"Available: {available}", (20, 120),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

    # ==============================
    # DRAW CAR BOXES (optional)
    # ==============================
    for (x1, y1, x2, y2) in cars:
        cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 255, 0), 2)

    # ==============================
    # SHOW WINDOW
    # ==============================
    cv2.imshow("🚗 Parking Intelligence System", frame)

    # Press ESC to exit
    if cv2.waitKey(25) & 0xFF == 27:
        break

# ==============================
# CLEANUP
# ==============================
cap.release()
cv2.destroyAllWindows()