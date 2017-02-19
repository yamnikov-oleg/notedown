import unittest

import markdown

class RenderTestCase(unittest.TestCase):

    CASES = [
        # Basic paragraphs
        ("", ""),
        (" \t\n", ""),
        ("test", "<p>test</p>"),
        ("test\npar", "<p>test par</p>"),
        ("test\npar\n\ntestpar2", "<p>test par</p><p>testpar2</p>"),
    ]

    def test_render(self):
        for source, expected in self.CASES:
            actual = markdown.render(source)
            self.assertEqual(actual, expected)
