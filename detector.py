import cv2
import json
import numpy as np
from ultralytics import YOLO

class ParkingDetector:
    def __init__(self, model_path, slot_file):
        # ✅ CORRECT: inside __init__
        self.model = YOLO(model_path)

        with open(slot_file, "r") as f:
            self.slots = json.load(f)

    def detect(self, frame):
        results = self.model(frame, verbose=False)[0]

        cars = []
        for box in results.boxes:
            cls = int(box.cls[0])

            if cls == 2:  # car
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                cars.append((x1, y1, x2, y2))

        return cars

    def check_slots(self, frame, cars):
        slot_status = []

        for slot in self.slots:
            pts = np.array(slot["points"], np.int32)
            occupied = False

            for (x1, y1, x2, y2) in cars:
                cx = (x1 + x2) // 2
                cy = (y1 + y2) // 2

                if cv2.pointPolygonTest(pts, (cx, cy), False) >= 0:
                    occupied = True
                    break

            slot_status.append({
                "id": slot["id"],
                "occupied": occupied
            })

            color = (0, 255, 0) if not occupied else (0, 0, 255)
            cv2.polylines(frame, [pts], True, color, 2)

        return slot_status