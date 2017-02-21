import re

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

def render_marker(line, marker, left, right):
    while marker in line:
        left_replaced = line.replace(marker, left, 1)
        if marker not in left_replaced:
            break
        line = left_replaced.replace(marker, right, 1)
    return line

def render_emphasis(line):
    line = render_marker(line, "***", "<strong><em>", "</em></strong>")
    line = render_marker(line, "___", "<strong><em>", "</em></strong>")
    line = render_marker(line, "**", "<strong>", "</strong>")
    line = render_marker(line, "__", "<strong>", "</strong>")
    line = render_marker(line, "*", "<em>", "</em>")
    line = render_marker(line, "_", "<em>", "</em>")
    return line

def render_line(line):
    line = render_emphasis(line)
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

def is_ul_item(line):
    LIST_MARKERS = ["* ", "+ ", "- "]
    line = line.strip()
    return any([ line.startswith(m) for m in LIST_MARKERS ])

def ol_item_contents_or_none(line):
    m = re.match('\s*\d+\.\s', line)
    if not m:
        return None

    return line[m.end():]

def is_ol_item(line):
    return ol_item_contents_or_none(line) is not None

def is_paragraph(line):
    return not is_header(line) and not is_ul_item(line) and not is_ol_item(line)

def render_header(lines):
    line = lines.next()
    if line is None:
        return ""

    lvl = header_level_or_0(line)
    if lvl == 0:
        return ""

    content = line.strip()[lvl+1:].strip()
    content = render_line(content)
    return "<h{lvl}>{content}</h{lvl}>".format(lvl=lvl, content=content)

def render_ul(lines):
    items = []

    def format_ul():
        return "<ul>{}</ul>".format("".join([
            "<li>{}</li>".format(it)
            for it in items
        ]))

    while True:
        line = lines.peek()
        if line is None:
            return format_ul()

        if is_ul_item(line):
            line = line.strip()[2:].strip()
            line = render_line(line)
            items.append(line)
        elif line.startswith(' ') or line.startswith('\t'):
            line = line.strip()
            line = render_line(line)
            items[len(items)-1] += " " + line
        else:
            return format_ul()

        lines.next()

def render_ol(lines):
    items = []

    def format_ol():
        return "<ol>{}</ol>".format("".join([
            "<li>{}</li>".format(it)
            for it in items
        ]))

    while True:
        line = lines.peek()
        if line is None:
            return format_ol()

        if is_ol_item(line):
            line = ol_item_contents_or_none(line).strip()
            line = render_line(line)
            items.append(line)
        elif line.startswith(' ') or line.startswith('\t'):
            line = line.strip()
            line = render_line(line)
            items[len(items)-1] += " " + line
        else:
            return format_ol()

        lines.next()

def render_paragraph(lines):
    text = lines.next()
    if text is None:
        return ""

    text = text.strip()
    if text == "":
        return ""

    text = render_line(text)

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

        line = render_line(line)
        text += " " + line
        lines.next()

def render_block(lines):
    line = lines.peek()
    if is_header(line):
        return render_header(lines)
    elif is_ul_item(line):
        return render_ul(lines)
    elif is_ol_item(line):
        return render_ol(lines)
    else:
        return render_paragraph(lines)

def render(md):
    lines = LinesIterator(md)
    html = ""
    while not lines.empty():
        html += render_block(lines)
    return html
