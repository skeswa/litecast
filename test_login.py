import socket

from stream import Connection
from message_builder import build_init_message

conn = Connection()
conn.write(build_init_message("Sandile Keswa", "skeswa", "+12673128763", "shikkic"))
raw_input("Press Enter to continue...")
