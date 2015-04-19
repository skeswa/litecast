import socket
import time

from stream import Connection
from message_builder import build_init_message, build_call_message

conn = Connection()
conn.write(build_init_message("Sandile Keswa", "skeswa", "+12673128763"))
time.sleep(1)
conn.write(build_call_message("shikkic"))

raw_input("Press Enter to continue...")
