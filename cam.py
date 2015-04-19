from threading import Thread
import cv2
from message_builder import build_video_frame_message
from stream import get_cap

def get_winsize():
    rows, columns = os.popen('stty size', 'r').read().split()
    return int(rows), int(columns)

def pixel_to_char(pixel):
    ramp = '  .:-=+*#%@'
    brightness = pixel / 255.0
    ramp_index = int(10 * brightness)
    return ramp[ramp_index]

def draw(cam, buff, rows, columns, index):
    if index % 2 == 0:
        return
    cap = cam.cap
    ret, img = cap.read()
    img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    compression_factor = max(len(img)/rows, len(img[0])/columns)
    output_rows = len(img)/compression_factor
    output_cols = len(img[0])/compression_factor
    padding_rows = (rows - output_rows) / 2
    padding_cols = (columns - output_cols) / 2
    i = 0
    for row in range(output_rows):
        for col in range(output_cols):
            pixel = img[row * compression_factor][col * compression_factor]
            char = pixel_to_char(pixel)
            buff[i] = char
            i = i + 1
    cam.sock.send(build_video_frame_message(output_cols, output_rows, buff[:(output_rows*output_cols)].decode("utf-8")) + '\x00')

def thread_cam(cam):
    rows = cam.rows
    cols = cam.cols
    buff = bytearray(rows * cols)
    i = 0
    while cam.working:
        i = i + 1
        draw(cam, buff, rows, cols, i)

class Cam:
    def __init__(self, sock):
        self.cap = get_cap()
        self.working = True
        self.cols = 120
        self.rows = 60
        self.sock = sock
        # Start the thread
        thread = Thread(target = thread_cam, args = (self,))
        thread.daemon = True
        thread.start()

    def stop(self):
        self.working = False
