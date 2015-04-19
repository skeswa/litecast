import socket
import time

from stream import Connection
from message_builder import build_init_message, build_call_message

conn = Connection()
conn.write(build_init_message("Dan Cadden", "shikkic", "+12158723266"))

raw_input("Press Enter to continue...")
