import time
import requests
import board
import busio
import os
import adafruit_ads1x15.ads1115 as ADS
from adafruit_ads1x15.analog_in import AnalogIn
from luma.core.interface.serial import i2c
from luma.oled.device import ssd1306
from luma.core.render import canvas
from PIL import ImageFont
from dotenv import load_dotenv
import statistics

load_dotenv()

# --- Hardware Setup ---
i2c_bus = busio.I2C(board.SCL, board.SDA)
ads = ADS.ADS1115(i2c_bus)

try:
    chan = AnalogIn(ads, ADS.P0)
except AttributeError:
    chan = AnalogIn(ads, 0)

serial = i2c(port=1, address=0x3C)
device = ssd1306(serial)

SERVER_URL = os.getenv("SERVER_URL")
AI_CHECK_URL = f"{SERVER_URL}/api/ai/latest-prediction"

# Load Fonts
try:
    font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 22)
    font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 12)
except:
    font_large = font_small = ImageFont.load_default()

print("System Online. Monitoring Analog Air Quality...")


def run_breathalyzer():
    print("Breathalyzer mode activated!")

    # Screen 1 — Get ready (Adjusted coords to fit 64px height)
    for i in range(3, 0, -1):
        with canvas(device) as draw:
            draw.text((10, 5), "GET READY", font=font_large, fill="white")
            draw.text((55, 35), str(i), font=font_large, fill="white")
        time.sleep(1)

    # Screen 2 — BLOW prompt
    with canvas(device) as draw:
        draw.text((25, 10), "BLOW!", font=font_large, fill="white")
        draw.text((20, 40), "Keep blowing...", font=font_small, fill="white")
    time.sleep(1)

    # Screen 3 — Live meter while reading
    readings = []
    baseline = chan.voltage

    for i in range(5):
        voltage = chan.voltage
        readings.append(voltage)

        spike = max(0, voltage - baseline)
        max_spike = 2.0
        level = min(spike / max_spike, 1.0)

        bar_max_width = 110
        bar_width = int(level * bar_max_width)

        if level < 0.3:
            status = "CLEAN"
        elif level < 0.7:
            status = "HMMMM"
        else:
            status = "WHOA!"

        with canvas(device) as draw:
            draw.text((0, 0), "ANALYZING...", font=font_small, fill="white")
            draw.line((0, 14, 128, 14), fill="white")
            draw.text((0, 16), f"Level: {voltage:.2f}V", font=font_small, fill="white")

            # Moved progress bar up slightly to fit status text
            draw.rectangle((0, 30, 110, 42), outline="white", fill="black")
            if bar_width > 0:
                draw.rectangle((0, 30, bar_width, 42), outline="white", fill="white")

            # Adjusted Y to 44 so 22pt font stops at pixel 66 (almost perfectly fits)
            draw.text((0, 44), status, font=font_large, fill="white")

            remaining = 5 - i
            dot_x = 118
            for d in range(remaining):
                draw.ellipse((dot_x, 30 + d * 6, dot_x + 4, 34 + d * 6), fill="white")

        time.sleep(1)

    peak = max(readings)
    spike = max(0, peak - baseline)

    try:
        requests.post(f"{SERVER_URL}/api/sensor/breathalyzer/result",
                      json={"voltage": peak, "spike": round(spike, 3)})
    except Exception as e:
        print(f"Failed to send result: {e}")

    # Screen 4 — Final result (Shortened line1 to prevent horizontal cutoff)
    if spike > 1.5:
        line1 = "YOU OK??"
        line2 = "Stay home!"
    elif spike > 0.8:
        line1 = "HMMMM..."
        line2 = "Drink water"
    elif spike > 0.3:
        line1 = "NOT BAD"
        line2 = "Almost fresh"
    else:
        line1 = "CLEAR!"
        line2 = "Fresh air!"

    for _ in range(3):
        with canvas(device) as draw:
            draw.text((5, 10), line1, font=font_large, fill="white")
            draw.text((5, 40), line2, font=font_small, fill="white")
        time.sleep(0.5)
        with canvas(device) as draw:
            pass
        time.sleep(0.3)

    with canvas(device) as draw:
        draw.text((5, 10), line1, font=font_large, fill="white")
        draw.text((5, 40), line2, font=font_small, fill="white")
    time.sleep(5)


try:
    readings = []
    loop_counter = 0
    
    while True:
        try:
            check = requests.get(f"{SERVER_URL}/api/sensor/breathalyzer/check", timeout=1)
            if check.json().get('active'):
                run_breathalyzer()
        except:
            pass

        voltage = chan.voltage
        readings.append(voltage)

        is_bad = voltage > 0.4

        with canvas(device) as draw:
            draw.text((0, 0), f"VOLTS: {voltage:.3f}V", font=font_small, fill="white")
            draw.line((0, 15, 128, 15), fill="white")

            if is_bad:
                draw.text((10, 25), " GAS!", font=font_large, fill="white")
            else:
                draw.text((10, 25), "AIR: OK", font=font_large, fill="white")

            draw.rectangle((0, 60, len(readings) * 2.13, 64), fill="white")

        if len(readings) >= 60:
            try:
                avg_v = statistics.mean(readings)
                payload = {"avg_voltage": round(avg_v, 3)}

                response = requests.post(f"{SERVER_URL}/api/sensor/ingest", json=payload, timeout=2)
                print(f"Sent Summary: Avg {avg_v:.3f}V - Status: {response.status_code}")

                readings = []
            except Exception as e:
                print(f"Server Error: {e}")
                readings = []

        if loop_counter % 10 == 0:
            try:
                ai_check = requests.get(AI_CHECK_URL, timeout=1)
                if ai_check.status_code == 200:
                    data = ai_check.json()
                    if data.get("new_data"):
                        msg = str(data['message'])
                        
                        # Calculate EXACT pixel width of the message
                        try:
                            text_width = int(font_small.getlength(msg))
                        except AttributeError:
                            # Fallback for older versions of Pillow on the Pi
                            text_width = int(font_small.getsize(msg)[0])
                        
                        # Scroll loop: start at x=128 (right edge), move left until EXACTLY off-screen
                        for x_pos in range(128, -text_width, -5):
                            with canvas(device) as draw:
                                # Static Header
                                draw.text((0, 0), "AI PREDICTION:", font=font_small, fill="white")
                                draw.line((0, 15, 128, 15), fill="white")
                                
                                # Moving Text
                                draw.text((x_pos, 30), msg, font=font_small, fill="white")
                            
                            time.sleep(0.05)

            except Exception as e:
                print(f"Polling Error: {e}")

        loop_counter += 1
        time.sleep(1)

except KeyboardInterrupt:
    print("Stopped.")
    
