

####
#
# main entry point into the LightCast app;
# @author Vuk Petrovic
#
###

import sys

def main():
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
            print "          -u    : specifies chat handle; typically your password; not seen by other users";
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

        print "Username: ", username, " User handle: ", userhandle;
        


main();
