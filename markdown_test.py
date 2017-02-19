import unittest

import markdown

class RenderTestCase(unittest.TestCase):

    def run_cases(self, cases):
        for source, expected in cases:
            actual = markdown.render(source)
            self.assertEqual(actual, expected, msg="Source: \"{}\"".format(source))

    EDGES = [
        ("", ""),
        (" \t\n", ""),
    ]

    def test_edges(self):
        self.run_cases(self.EDGES)

    PARAGRAPHS = [
        ("test", "<p>test</p>"),
        ("test  ", "<p>test</p>"),
        ("test\npar", "<p>test par</p>"),
        ("test\npar  \n\n  testpar2", "<p>test par</p><p>testpar2</p>"),
    ]

    def test_paragraphs(self):
        self.run_cases(self.PARAGRAPHS)

    HEADERS = [
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

    def test_headers(self):
        self.run_cases(self.HEADERS)

    UNORDERED_LISTS = [
        (
            "* First item \n* Second item\n*  Third item\n",
            "<ul><li>First item</li><li>Second item</li><li>Third item</li></ul>",
        ),
        (
            "+ First item \n  + Second item\n+  Third item\n",
            "<ul><li>First item</li><li>Second item</li><li>Third item</li></ul>",
        ),
        (
            "- First item \n- Second item\n  -  Third item\n",
            "<ul><li>First item</li><li>Second item</li><li>Third item</li></ul>",
        ),
        (
            "+ First item \n  * Second item\n-  Third item\n",
            "<ul><li>First item</li><li>Second item</li><li>Third item</li></ul>",
        ),
        (
            "Pretext\n- First item \n- Second item\nPosttext",
            "<p>Pretext</p><ul><li>First item</li><li>Second item</li></ul><p>Posttext</p>",
        ),
        (
            "*First item \n+Second item\n-Third item\n* A real item",
            "<p>*First item +Second item -Third item</p><ul><li>A real item</li></ul>",
        ),
        (
            "* First item \n* Second item\n\n*  Third item\n",
            "<ul><li>First item</li><li>Second item</li></ul><ul><li>Third item</li></ul>",
        ),
    ]

    def test_unordered_lists(self):
        self.run_cases(self.UNORDERED_LISTS)

    ORDERED_LISTS = [
        (
            "1. First item \n2. Second item\n3.  Third item\n",
            "<ol><li>First item</li><li>Second item</li><li>Third item</li></ol>",
        ),
        (
            "1. First item \n  1. Second item\n1.  Third item\n",
            "<ol><li>First item</li><li>Second item</li><li>Third item</li></ol>",
        ),
        (
            "1. First item \n  3. Second item\n2.  Third item\n",
            "<ol><li>First item</li><li>Second item</li><li>Third item</li></ol>",
        ),
        (
            "Pretext\n1. First item \n2. Second item\nPosttext",
            "<p>Pretext</p><ol><li>First item</li><li>Second item</li></ol><p>Posttext</p>",
        ),
        (
            "1.First item \n1 Second item\n1 . Third item\n1. A real item",
            "<p>1.First item 1 Second item 1 . Third item</p><ol><li>A real item</li></ol>",
        ),
        (
            "1. First item \n2. Second item\n\n3.  Third item\n",
            "<ol><li>First item</li><li>Second item</li></ol><ol><li>Third item</li></ol>",
        ),
    ]

    def test_ordered_lists(self):
        self.run_cases(self.ORDERED_LISTS)
