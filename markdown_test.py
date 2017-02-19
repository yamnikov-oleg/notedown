import unittest

import markdown

class RenderTestCase(unittest.TestCase):

    CASES = [
        # Basic paragraphs
        ("", ""),
        (" \t\n", ""),
        ("test", "<p>test</p>"),
        ("test  ", "<p>test</p>"),
        ("test\npar", "<p>test par</p>"),
        ("test\npar  \n\n  testpar2", "<p>test par</p><p>testpar2</p>"),
        # Headers
        ("# Hello", "<h1>Hello</h1>"),
        ("#   Hello", "<h1>Hello</h1>"),
        ("  #   Hello  ", "<h1>Hello</h1>"),
        ("## Hello", "<h2>Hello</h2>"),
        ("###### Hello", "<h6>Hello</h6>"),
        ("#Hello", "<p>#Hello</p>"),
        ("####### Hello", "<p>####### Hello</p>"),
        ("### Hello\nworld", "<h3>Hello</h3><p>world</p>"),
        ("### Hello\n\nworld\n!", "<h3>Hello</h3><p>world !</p>"),
        ("Hello\n## world\n!", "<p>Hello</p><h2>world</h2><p>!</p>"),
        ("###", "<p>###</p>"),
        ("### ", "<p>###</p>"),
    ]

    def test_render(self):
        for source, expected in self.CASES:
            actual = markdown.render(source)
            self.assertEqual(actual, expected, msg="Source: \"{}\"".format(source))
