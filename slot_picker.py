import cv2
import json

VIDEO_PATH = "car-parking.mp4"
slots = []
current_slot = []
slot_id = 1

cap = cv2.VideoCapture(VIDEO_PATH)
ret, frame = cap.read()
frame = cv2.resize(frame, (960, 540))
clone = frame.copy()

def click(event, x, y, flags, param):
    global current_slot, slot_id, frame

    if event == cv2.EVENT_LBUTTONDOWN:
        current_slot.append([x, y])
        cv2.circle(frame, (x, y), 4, (0, 255, 255), -1)

        if len(current_slot) == 4:
            pts = current_slot.copy()
            slots.append({"id": f"S{slot_id}", "points": pts})
            slot_id += 1
            cv2.polylines(frame, [__import__('numpy').array(pts)], True, (0,255,0), 2)
            cv2.putText(frame, f"S{slot_id-1}", tuple(pts[0]),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255,255,255), 1)
            current_slot = []
            print(f"✅ Slot S{slot_id-1} saved!")

cv2.namedWindow("Define Slots")
cv2.setMouseCallback("Define Slots", click)

print("🖱 Click 4 corners of each slot — top-left, top-right, bottom-right, bottom-left")
print("Press 'S' to save | Press 'R' to reset | Press 'Q' to quit")

while True:
    cv2.imshow("Define Slots", frame)
    key = cv2.waitKey(1) & 0xFF

    if key == ord('s'):
        with open("slots.json", "w") as f:
            json.dump(slots, f, indent=2)
        print(f"✅ {len(slots)} slots saved to slots.json!")

    elif key == ord('r'):
        frame = clone.copy()
        slots = []
        current_slot = []
        slot_id = 1
        print("🔄 Reset!")

    elif key == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()