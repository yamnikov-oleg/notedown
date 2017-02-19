class LinesIterator:

    def __init__(self, string):
        self.lines = string.replace('\r', '').split('\n')

    def empty(self):
        return len(self.lines) == 0

    def peek(self):
        if self.empty():
            return None
        else:
            return self.lines[0]

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

def header_level_or_0(line):
    level = 0

    for c in line.strip():
        if c == "#":
            level += 1
        elif c == " ":
            break
        else:
            level = 0
            break
    # No break was called, header prefix wasn't terminated properly
    else:
        level = 0

    # Only header levels 1..6 are allowed
    if level > 6:
        level = 0

    return level

def is_header(line):
    return header_level_or_0(line) != 0

def is_paragraph(line):
    return not is_header(line)

def render_header(lines):
    line = lines.next()
    if line is None:
        return ""

    lvl = header_level_or_0(line)
    if lvl == 0:
        return ""

    content = line.strip()[lvl+1:].strip()
    return "<h{lvl}>{content}</h{lvl}>".format(lvl=lvl, content=content)

def render_paragraph(lines):
    text = lines.next_non_empty()
    if not text:
        return ""
    text = text.strip()

    def format_par():
        return "<p>{}</p>".format(text)

    while True:
        line = lines.peek()
        if line is None:
            return format_par()

        if not is_paragraph(line):
            return format_par()

        line = line.strip()
        if line == "":
            return format_par()

        text += " " + line
        lines.next()

def render_block(lines):
    line = lines.peek()
    if is_header(line):
        return render_header(lines)
    else:
        return render_paragraph(lines)

def render(md):
    lines = LinesIterator(md)
    html = ""
    while not lines.empty():
        html += render_block(lines)
    return html
