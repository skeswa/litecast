import json

def parse_incoming_message(payload):
    print("Incoming payload for message parser: " + payload)
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
    elif message["type"] == "call_failed":
        # TODO prompt the user with failure message
        print("unsuccessful call")
    elif message["type"] == "videoframe":
        parse_video_frame_message(payload)
    elif message["type"] == "chat":
        parse_chat_message(payload)
    elif message["type"] == "audiosnippet":
        parse_audio_snippet_message(payload)
    else:
        # TODO Freak the fuck out
        print("Could not place the message type: " + message["type"])

def parse_video_frame_message(payload):
    print('1')

def parse_chat_message(payload):
    print('2')

def parse_audio_snippet_message(payload):
    print('3')
