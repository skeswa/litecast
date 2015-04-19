import json
import cam
from shitter import Shitter

shitter = Shitter()

def parse_incoming_message(payload, sock):
    message = json.loads(payload)
    # Conditional logic for each message type
    if message["type"] == "init_succeeded":
        # TODO go main chat view
        print("successful init")
    elif message["type"] == "init_failed":
        # TODO prompt the user with failure message
        print("unsuccessful init")
    elif message["type"] == "call_succeeded":
        # TODO prompt the user with failure message
        print("successful call")
        start_streaming_cam(sock)
    elif message["type"] == "call_failed":
        # TODO prompt the user with failure message
        print("unsuccessful call")
    elif message["type"] == "call_invoked":
        # TODO prompt the user with failure message
        print("call invoked")
    elif message["type"] == "call_ended":
        # TODO prompt the user with failure message
        print("call ended")
    elif message["type"] == "videoframe":
        parse_video_frame_message(message)
    elif message["type"] == "chat":
        parse_chat_message(payload)
    elif message["type"] == "audiosnippet":
        parse_audio_snippet_message(payload)
    else:
        # TODO Freak the fuck out
        print("Could not place the message type: " + message["type"])

def start_streaming_cam(sock):
    c = cam.Cam(sock)

def parse_video_frame_message(payload):
    global shitter
    shitter.blit(payload["data"]["content"])

def parse_chat_message(payload):
    print('2')

def parse_audio_snippet_message(payload):
    print('3')
