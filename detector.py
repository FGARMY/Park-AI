import cv2
import json
import numpy as np

class ParkingDetector:
    def __init__(self, slot_file):
        with open(slot_file, "r") as f:
            self.slots = json.load(f)

    def check_slots(self, frame):
        slot_status = []
        for slot in self.slots:
            pts = np.array(slot["points"], np.int32)
            x, y, w, h = cv2.boundingRect(pts)
            roi = frame[y:y+h, x:x+w]
            if roi.size == 0:
                occupied = False
            else:
                gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
                avg = np.mean(gray)
                occupied = avg < 85  # tune this threshold
            slot_status.append({
                "id": slot["id"],
                "occupied": occupied
            })
        return slot_status