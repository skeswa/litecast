import socket

from stream import connect, write_to_stream
from message_builder import build_identity_message

connect()
write_to_stream(build_identity_message("Sandile Keswa", "me@sandile.io", "+12673128763"))
