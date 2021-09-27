"""
alternatives-nb: Jupyter Notebook extension that helps users manage decision points 
and explore alternatives to better document reasoning and rationale.
"""

from distutils.core import setup

setup(
    name='alternatives-nb',
    version='0.1',
    description=(
        'Jupyter Notebook extension that helps users manage decision points ',
        'and explore alternatives to better document reasoning and rationale.'
    ),
    author='Nicholas Sinclair',
    author_email='nicholaspsinclair@gmail.com',
    license='BSD-3-Clause',
    packages=['alternatives-nb'],
    package_dir={'alternatives-nb': 'alternatives-nb'},
    package_data={'alternatives-nb': ['static/*.js', 'static/*.css', 'static/config/*.md', 'static/config/*.yaml']}
)
