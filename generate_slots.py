import json

slots = []
slot_id = 1

# Adjust based on your video
rows_y = [80, 180, 280, 380]
start_x = 20
slot_width = 55
slot_height = 60
gap = 5
cols = 12

for y in rows_y:
    for i in range(cols):
        x1 = start_x + i * (slot_width + gap)
        y1 = y
        x2 = x1 + slot_width
        y2 = y1 + slot_height

        slots.append({
            "id": slot_id,
            "points": [[x1,y1],[x2,y1],[x2,y2],[x1,y2]]
        })
        slot_id += 1

# Save to JSON
with open("slots.json", "w") as f:
    json.dump(slots, f, indent=2)

print("✅ slots.json generated!")