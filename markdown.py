import re

import mistune

def render(md):
    rendered = mistune.markdown(md)
    cb_ind = 0
    while True:
        m = re.search("\[(x| )\]", rendered)
        if m is None:
            break

        checkmark = m.groups()[0]
        if checkmark == "x":
            html = '<input type="checkbox" data-index="{}" checked>'.format(cb_ind)
        else:
            html = '<input type="checkbox" data-index="{}">'.format(cb_ind)

        rendered = rendered[:m.start()] + html + rendered[m.end():]
        cb_ind += 1

    return rendered
