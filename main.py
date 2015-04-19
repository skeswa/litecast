
import sys
import requests
import json
from curses import wrapper
from ui import ChatUI

def main(stdscr):
    arg_length = len(sys.argv);
    #print "Script running", arg_length, sys.argv[0];
    print "";
    if arg_length < 2:
        print "Error: could not open LiteCast; no args supplied. Use parameter --help for info.";
        print "";
    elif arg_length == 2:
        if sys.argv[1] == '--help':
            print "Usage: litecast [parameters]";
            print "         --help : displays a list of currently accepted commands by litecast";
            print "          -n    : specifies chat screen name; this is visible to other users";
            print "          -u    : specifies chat handle; namely your phone number; not seen by other users";
            print "";
        else: 
            print "Error: unknown argument. Use parameter --help for more info.";
            print "";
    elif arg_length >= 5:
        if '-n' in sys.argv:
            name_index = sys.argv.index('-n') + 1;
        else: 
            print "Error: no name supplied. Use parameter --help for more info.";
            exit();
        if '-u' in sys.argv: 
            user_index = sys.argv.index('-u') + 1;
        else: 
            print "Error: no handle supplied. Use parameter --help for more info.";

        username = sys.argv[name_index];
        userhandle = sys.argv[user_index];

        
        data = {'username': username, 'handle': userhandle};
        r = requests.post("http://litecst.cloudapp.net/login", data=json.dumps(data));
        #users = json.loads(r.text);
        #users = users['users'];
        
        stdscr.clear()
        ui = ChatUI(stdscr)
        ui.userlist.append(username)
        #for i in users:
        #    ui.userlist.append(i['user']);
        
        ui.redraw_userlist()
        inp = ""
        ui.chatbuffer_add("Welcome to LiteCast!");
        ui.chatbuffer_add("To the left you see all users currently logged in.");
        ui.chatbuffer_add("To initiate a call, simply type /call <username>");
        ui.chatbuffer_add("------------------------------------------------");
        while inp != "/quit":
            inp = ui.wait_input()
        #ui.chatbuffer_add(inp)
            if not "/call" in inp:
                ui.chatbuffer_add("\n");
                ui.chatbuffer_add("Hey, that's not a command!");
                ui.chatbuffer_add("To call someone type '/call <username>'");
            else:
            #check to see if the user is logged in, if so call them
                destination_user = inp.index('/call') + 5;
                destination_user = inp[destination_user:];
                if not destination_user in ui.userlist:
                    print "\nThat user isn't currently logged in!";
                else: 
                    dest_string = "\nInitiating call with " + destination_user + "!";
                    ui.chatbuffer_add(dest_string);
                    #call sandile's script here

wrapper(main);
