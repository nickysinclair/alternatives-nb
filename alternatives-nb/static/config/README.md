# alternatives-nb
Jupyter Notebook extension that helps users manage decision points 
and explore alternatives to better document reasoning and rationale.

## Motivation

alternatives-nb 

## Installation
As is standard with [Jupyter Notebook extensions](http://jupyter-notebook.readthedocs.io/en/stable/examples/Notebook/Distributing%20Jupyter%20Extensions%20as%20Python%20Packages.html), to install alternatives-nb you need to first install the
extension's python package, and then install the nbextension.

If you have already cloned this repository onto your machine, you should be
able to navigate to the top level "alternatives-nb" folder (with `setup.py` in it) and run
the following commands:

```bash
pip install .  # can add --user if you only want to install for the current user
jupyter nbextension install --py alternatives-nb  # can add --user here too
jupyter nbextension enable --py alternatives-nb
```

Note that alternatives-nb is still in alpha, so you may encounter bugs. If you would 
like to disable alternatives-nb, run the following commands:

```bash
jupyter nbextension disable --py alternatives-nb
```
