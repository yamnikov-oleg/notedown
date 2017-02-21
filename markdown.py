import mistune

def render(md):
    rendered = mistune.markdown(md)
    rendered = rendered.replace("[ ]", '<input type="checkbox" disabled>')
    rendered = rendered.replace("[x]", '<input type="checkbox" disabled checked>')
    return rendered
