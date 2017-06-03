import re
from urllib.parse import urlencode

import mistune

def _render_checkboxes(rendered):
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

def _render_latex_formulas(rendered):
    while True:
        m = re.search("\$\$([^\n]+)\$\$", rendered)
        if m is None:
            break

        query = urlencode({
            'cht': 'tx',
            'chl': m.groups()[0],
            'chf': 'bg,s,ffffff00',
        })
        html = '<img src="https://chart.googleapis.com/chart?{}" class="latex-formula">'.format(query)
        rendered = rendered[:m.start()] + html + rendered[m.end():]

    return rendered

def render(md, checkboxes=True, latex_formulas=False):
    rendered = mistune.markdown(md)

    if checkboxes:
        rendered = _render_checkboxes(rendered)

    if latex_formulas:
        rendered = _render_latex_formulas(rendered)

    return rendered
