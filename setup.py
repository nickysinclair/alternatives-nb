"""
Janus: Jupyter Notebook extension that helps users keep clean notebooks by
hiding cells and tracking changes
"""

from distutils.core import setup

setup(
    name='janus',
    version='0.1',
    description=(
        'Jupyter Notebook extension that helps users manage decision points ',
        'and explore alternatives and document reasoning and rationale.'
    ),
    author='Nicholas Sinclair',
    author_email='nicholaspsinclair@gmail.com',
    license='BSD-3-Clause',
    packages=['janus'],
    package_dir={'janus': 'janus'},
    package_data={'janus': ['static/*.js', 'static/*.css']}
)
