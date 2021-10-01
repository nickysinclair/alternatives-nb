[![Binder](https://mybinder.org/badge_logo.svg)](https://beta.mybinder.org/v2/gh/nickysinclair/alternatives-nb/HEAD?urlpath=/tree/Untitled.ipynb)

# alternatives-nb

Jupyter Notebook extension that helps users manage decision points and explore alternatives to better document reasoning and rationale.

As elaborated in [Bugs and Issues](#bugs-and-issues), this project is not intended for public use due to presence of undesirable behaviors and application bugs.

## Motivation

_alternatives-nb_ is the software product in partial fulfillment of a master's dissertation in Data Science at City, University of London. The motivation for alternatives-nb is described in the dissertation project report, which is not publicly available.

## Copyright and License

alternatives-nb is originally forked from [_janus_](https://github.com/acrule/janus), a Jupyter Notebook extension designed to help organize notebooks and part of a [published research paper](https://dl.acm.org/doi/pdf/10.1145/3274419) on the topic. The vast majority of the source code is completely rewritten for the alternatives-nb application, but the janus BSD-3-Clause License is maintained alongside a new BSD-3-Clause License for this project (see [LICENSE.txt](/LICENSE.txt))

## Binder

[Try out the extension online](https://beta.mybinder.org/v2/gh/nickysinclair/alternatives-nb/HEAD?urlpath=/tree/Untitled.ipynb) in Jupyter's online editing notebook environment, Binder. The extension is tested and shown to be moderately functional in Safari 14 and Safari 15.

## Machine Installation

The below machine installation instructions assume a prior installation of _pip_ and _Python_ on the target local machine.

```bash
# install jupyter notebook
pip install notebook

# installs convenient (optional) contributor extensions to jupyter server
# some of these extensions can be used to enable/disable extensions
jupyter contrib nbextension install --user

# install alternatives-nb from GitHub, install JS/CSS to jupyter server, enable
pip install git+https://github.com/nickysinclair/alternatives-nb.git
jupyter nbextension install --py alternatives-nb --user
jupyter nbextension enable  --py alternatives-nb --user

# Trust desired file in current working directory
jupyter trust Untitled.ipynb

# start notebook server (typically at localhost:8888)
jupyter notebook
```

To later uninstall the extension from the target local machine:

```bash
jupyter nbextension disable --py alternatives-nb --user
jupyter nbextension uninstall --py alternatives-nb --user
pip uninstall alternatives-nb
```

## Bugs and Issues

As of this writing, alternatives-nb is a proof-of-concept prototype and undesirable behaviors and application bugs do exist. Please reach out in case of interest in using alternatives-nb.
