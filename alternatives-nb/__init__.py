"""
alternatives-nb: Jupyter Notebook extension that helps users manage decision points 
and explore alternatives to better document reasoning and rationale.
"""

def _jupyter_nbextension_paths():
    """
    nbextension configuration
    
    See for details on how to implement:
    https://testnb.readthedocs.io/en/latest/examples/Notebook/Distributing%20Jupyter%20Extensions%20as%20Python%20Packages.html#Defining-the-server-extension-and-nbextension
    """

    return [dict(
        section="notebook",
        # the path is relative to the `alternatives-nb` directory
        src="static",
        # directory in the `alternatives-nb/` namespace
        dest="alternatives-nb",
        # _also_ in the `alternatives-nb/` namespace
        require="alternatives-nb/main")]