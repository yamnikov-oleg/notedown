import mistune

def render(md):
    rendered = mistune.markdown(md)
    return rendered
