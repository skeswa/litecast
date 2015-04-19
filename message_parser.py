import json

def parse_incoming_message(payload):
    message = json.loads(payload)
    # Conditional logic for each message type
    if message["type"] is "videoframe":
        parse_video_frame_message(payload)
    elif message["type"] is "chat":
        parse_chat_message(payload)
    elif message["type"] is "audiosnippet":
        parse_audio_snippet_message(payload)
    else:
        # TODO Freak the fuck out
        print('\a')

def parse_video_frame_message(payload):
    print('1')

def parse_chat_message(payload):
    print('2')

def parse_audio_snippet_message(payload):
    print('3')
