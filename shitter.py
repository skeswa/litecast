import curses

class Shitter:
    def __init__(self):
        curses.initscr()
        curses.start_color()
        curses.curs_set(0)
        curses.use_default_colors()
        self.win = curses.newwin(60, 106, 0, 0)

    def get_winsize():
        rows, columns = os.popen('stty size', 'r').read().split()
        return int(rows), int(columns)

    def blit(self, shit):
        rows = 60
        cols = 106
        i = 0
        for c in shit:
            try:
                curr_row = i / cols
                curr_col = i % cols
                self.win.addch(curr_row, curr_col, c.encode('ascii','ignore'))
            except:
                pass
            i = i + 1
        self.win.refresh()
