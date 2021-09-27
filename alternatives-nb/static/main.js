/**
alternatives-nb: Jupyter Notebook extension that helps users manage decision points 
and explore alternatives to better document reasoning and rationale.
*/

define([
    "require",
    "jquery",
    "base/js/namespace",
    "base/js/events",
    "../alternatives-nb/metadataModel",
    "../alternatives-nb/headerView",
    "../alternatives-nb/alternativeController",
    "../alternatives-nb/patchController",
    "../alternatives-nb/utils",
], function(
    require,
    $,
    Jupyter,
    events,
    metadataModel,
    headerView,
    alternativeController,
    patchController,
    litUtils,
) {
    function injectPackages() {
        /**
         * Fetching modules from the open web
         * 
         * Modules successfully appear as `<script>` in header, but are
         * not callable from the extension
         */

        var s = document.createElement("script");
        s.type = "module"; // OR try text/javascript
        s.src = "https://cdn.jsdelivr.net/npm/uuid@latest/dist/umd/uuidv4.min.js";
        $("head").append(s);
    }

    function loadCSS() {
        /** 
         * Load CSS for the extension 
         */

        litUtils.log("Loading CSS from main.css ...")

        var link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = require.toUrl("./main.css");
        document.getElementsByTagName("head")[0].appendChild(link);
    }

    function loadExtensionPostNotebook() {
        /**
         * Load extension functionality after notebook loaded
         * */

        litUtils.log("Loading alternatives-nb ....");

        headerView.renderHeaderUI();
        metadataModel.setDefaultNotebookMetadata();
        alternativeController.renderAlternativesFromJSON();
        patchController.patchKeyboard()

        litUtils.log("alternatives-nb loaded!");
    }

    function loadExtension() {
        /** 
         * Called as extension loads and notebook opens
         */


        loadCSS();
        patchController.patchNotebook();
        patchController.patchActions();

        // make sure notebook is fully loaded before interacting with it
        if (Jupyter.notebook !== undefined && Jupyter.notebook._fully_loaded) {
            loadExtensionPostNotebook();
        }
        events.on("notebook_loaded.Notebook", loadExtensionPostNotebook);
    }

    /**
     * Tell Jupyter what to run when the extension loads
     */
    return {
        load_jupyter_extension: loadExtension,
        load_ipython_extension: loadExtension,
    };
});