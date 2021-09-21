/*
 * Class acting as controller for handling user interactions from DOM and data
 * model interactions with JSON metadata.
 */

define([
    "jquery",
    "base/js/namespace",
    "notebook/js/cell",
    "../janus/metadataModel",
    "../janus/uuidv4",
], function($, Jupyter, Cell, metadataModel, uuidv4) {
    class Alternative {
        constructor(nb, data = null) {
            /*
             * Alternative
             *
             * Args:
             *  - nb: `Jupyter.notebook` instance (i.e., this notebook)
             *  - data: `data` from view saved in Models and rendering UI
             */

            var alternative = this;
            Jupyter.alternative = alternative;

            alternative.notebook = nb;

            // TODO : Maybe instead return all default data and then set as
            // class attributes?
            var id = metadataModel.setDefaultAlternativeMetadata();
            metadataModel.updateAlternativeMetadata(id, data);

            return this;
        }
    }

    class AlternativeSet {
        constructor(nb, alternatives) {
            /*
             *
             *
             * Args:
             *  - nb: `Jupyter.notebook` instance (i.e., this notebook)
             *  - data: `data` from dialog view
             */

            this.alternatives = alternatives;
            this.id = uuidv4();

            // TODO : This is pulled from sidebar.js - is it needed?
            var alternativeSet = this;
            Jupyter.alternativeSet = alternativeSet;
            this.alternativeSet.notebook = nb;

            return this;
        }
    }

    function createAlternative(data) {
        /* Create an alternative */

        console.log("Creating alternative ...");

        return new Alternative(Jupyter.notebook, data);
    }

    function createAlternativeSet(data) {
        /*
         * Create set of alternatives
         *
         * Args:
         *  - data: set of data from user dialog
         *
         * Example data expected:
         * [
         *     {
         *         "alternativeStatus": "option",
         *         "alternativeParent": "5c3cab97-1fb4-407e-b55b-3ae1c6f5dfdb",
         *         "alternativeReasoning": {
         *             "decisionRationale": [
         *                 "methodology",
         *                 "prior work",
         *                 "data",
         *                 "expertise",
         *                 "communication",
         *                 "sensitivity"
         *             ],
         *             "alternativesTrigger": [
         *                 "opportunism",
         *                 "systematicity",
         *                 "robustness",
         *                 "contingency"
         *             ]
         *        }
         * ]
         */

        // Assume data comes as Array of alternatives representing user
        // input from dialog
        var alternatives = [];
        for (let i = 0; i < data.length; i++) {
            var alt = createAlternative(data[i]);
            alternatives.push(alt);
        }

        // Create AlternativeSet with alternatives, then update alternatives
        // with newly generated AlternativeSet ID
        var alternativeSet = new AlternativeSet(Jupyter.notebook, alternatives);
        for (let i = 0; i < alternativeSet.alternatives.length; i++) {
            metadataModel.updateAlternativeMetadata(
                alternativeSet.alternatives[i].id, { alternativeSet: alternativeSet.id }
            );
        }

        // TODO : Manipulate DOM to create new alternativeSet container

        // TODO : Manipulate DOM to populate container with alternatives

        return alternativeSet;
    }

    return {
        createAlternative: createAlternative,
        createAlternativeSet: createAlternativeSet,
    };
});