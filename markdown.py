class LinesIterator:

    def __init__(self, string):
        self.lines = string.replace('\r', '').split('\n')

    def empty(self):
        return len(self.lines) == 0

    def next(self):
        if self.empty():
            return None

        l = self.lines[0]
        self.lines = self.lines[1:]
        return l

    def next_non_empty(self):
        while True:
            line = self.next()

            if line is None:
                return None

            if line.strip() == "":
                continue
            else:
                return line

def render_block(lines):
    text = lines.next_non_empty()
    if not text:
        return ""

    def format_par():
        return "<p>{}</p>".format(text)

    while True:
        line = lines.next()
        if line is None:
            return format_par()

        line = line.strip()
        if line == "":
            return format_par()

        text += " " + line

def render(md):
    lines = LinesIterator(md)
    html = ""
    while not lines.empty():
        html += render_block(lines)
    return html
