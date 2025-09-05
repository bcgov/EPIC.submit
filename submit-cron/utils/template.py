"""Template Services."""

import os

from jinja2 import Environment, FileSystemLoader


templates_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../', 'templates'))
ENV = Environment(loader=FileSystemLoader(templates_dir), autoescape=True)


class Template:
    """Template helper class."""

    @staticmethod
    def get_template(template_filename, sub_directory=None):
        """Get a template from the common template folder."""
        if sub_directory:
            template_path = os.path.join(sub_directory, template_filename).replace(os.sep, '/')
        else:
            template_path = template_filename
        return ENV.get_template(template_path)
