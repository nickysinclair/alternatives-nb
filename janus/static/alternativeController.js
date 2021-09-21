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
    "../janus/utils",
], function($, Jupyter, Cell, metadataModel, uuidv4, litUtils) {
    class Alternative {
        constructor(data = null) {
            /*
             * Alternative
             *
             * Args:
             *  - data: `data` from view saved in Models and rendering UI
             */

            // Attaches instance to Jupyter global for access convenience
            var alternative = this;
            Jupyter.alternative = alternative;

            // TODO : Maybe instead return all default data and then set as
            // class attributes?
            var defaultMetadata = metadataModel.setDefaultAlternativeMetadata();
            Object.assign(this, defaultMetadata);

            if (data) {
                var updatedMetadata = metadataModel.updateAlternativeMetadata(
                    this.id,
                    data
                );
                Object.assign(this, updatedMetadata);
            }

            return this;
        }
    }

    class AlternativeSet {
        constructor() {
            /*
             *
             *
             * Args:
             *  - data: `data` from dialog view specifying alternatives set
             */

            // Attaches instance to Jupyter global for access convenience
            var alternativeSet = this;
            Jupyter.alternativeSet = alternativeSet;

            this.id = uuidv4();
            this.alternatives = [];

            return this;
        }

        setAlternatives(newAlternatives) {
            /* Expect an Array even if single alternative */

            for (let i = 0; i < newAlternatives.length; i++) {
                this.alternatives.push(newAlternatives[i]);
            }
        }
    }

    function createAlternative(data) {
        /* Create an alternative */

        console.log("Creating alternative ...");

        return new Alternative(data);
    }

    function createAlternativeSet(data) {
        /*
         * Create set of alternatives
         *
         * Args:
         *  - data: set of data from user dialog
         *
         * Example data expected:
         *
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
         *
         * [
         *  {
         *      title: "",
         *      status: "",
         *      triggers: [],
         *      decisions: []
         *  },
         *  {
         *      title: "",
         *      status: "",
         *      triggers: [],
         *      decisions: []
         *  }
         * ]
         */

        var alternativeSet = new AlternativeSet();

        // TO DO : Set alternativeParent by requesting DOM for whether current
        // cell is within an alternative

        // Assume data comes as Array of alternatives representing user
        // input from dialog
        var alternatives = [];
        for (let i = 0; i < data.length; i++) {
            var alt = createAlternative({
                alternativeSet: alternativeSet.id,
                alternativeTitle: data[i].title,
                alternativeStatus: data[i].status,
                alternativeReasoning: {
                    alternativesTrigger: data[i].triggers,
                    decisionRationale: data[i].decisions,
                },
            });
            alternatives.push(alt);
        }
        // Store with AlternativeSet object
        alternativeSet.setAlternatives(alternatives);

        // TODO : Manipulate DOM to create new alternativeSet container

        // TODO : Manipulate DOM to populate container with alternatives
    }

    return {
        createAlternative: createAlternative,
        createAlternativeSet: createAlternativeSet,
    };
});