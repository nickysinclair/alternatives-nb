/*
Janus: Jupyter Notebook extension that helps users keep clean notebooks by
hiding cells and tracking changes
*/

define([
    'require',
    'jquery',
    'base/js/namespace',
    'base/js/events',
    '../janus/metadata',
    '../janus/headerUI',
], function(
    require,
    $,
    Jupyter,
    events,
    litMetadata,
    litHeaderUI,
) {

    function injectPackages() {
        /*
         * Intended for fetching modules from the open web, but module not usable so far ...
         */

        var s = document.createElement("script");
        s.type = "module"; // OR try text/javascript
        s.src = "https://cdn.jsdelivr.net/npm/uuid@latest/dist/umd/uuidv4.min.js";
        $("head").append(s);
    };

    function loadCSS() {
        /* Load css for the extension */

        console.log('Loading CSS from main.css ...');

        var link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = require.toUrl("./main.css");
        document.getElementsByTagName("head")[0].appendChild(link);
    };


    function loadLitPostNotebook() {
        /* run steps that require cells to already be loaded */

        console.log('Loading Literate Analytics ....');

        litHeaderUI.renderLitUI();
        litMetadata.setDefaultForkMetadata();

        console.log('Literate Analytics loaded!');
    }


    function loadExtension() {
        /* Called as extension loads and notebook opens */

        loadCSS();
        //JanusSidebar.createSidebar();
        //JanusPatch.applyJanusPatches();

        // make sure notebook is fully loaded before interacting with it
        if (Jupyter.notebook !== undefined && Jupyter.notebook._fully_loaded) {
            loadLitPostNotebook();
        }
        events.on("notebook_loaded.Notebook", loadLitPostNotebook);
    }


    // Tell Jupyter what to run when the extension loads
    return {
        load_jupyter_extension: loadExtension,
        load_ipython_extension: loadExtension
    };

});