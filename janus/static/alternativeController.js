/*
 * Class acting as controller for handling user interactions from DOM and data
 * model interactions with JSON metadata.
 */

define([
    "jquery",
    "base/js/namespace",
    "notebook/js/cell",
    "notebook/js/codecell",
    "notebook/js/textcell",
    "../janus/metadataModel",
    "../janus/uuidv4",
    "../janus/utils",
], function($, Jupyter, cell, codecell, textcell, metadataModel, uuidv4, litUtils) {
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

        arrangeAlternativesStatus() {
            /* Set "choice" status alternatives at the front of Array */

            var choiceAlternatives = [];
            var optionAlternatives = [];
            var archivedAlternatives = [];
            for (let i = 0; i < this.alternatives.length; i++) {
                var thatAlternative = this.alternatives[i];
                switch (thatAlternative.alternativeStatus) {
                    case "choice":
                        choiceAlternatives.push(thatAlternative);
                        break;
                    case "option":
                        optionAlternatives.push(thatAlternative);
                        break;
                    case "archived":
                        archivedAlternatives.push(thatAlternative);
                        break;
                }
            }
            var arrangedAlternatives = choiceAlternatives.concat(optionAlternatives).concat(archivedAlternatives);
            this.alternatives = arrangedAlternatives;
        }

        setAlternatives(newAlternatives) {
            /* Expect an Array even if single alternative */

            for (let i = 0; i < newAlternatives.length; i++) {
                this.alternatives.push(newAlternatives[i]);
            }
            this.arrangeAlternativesStatus();
        }
    }

    function createAlternative(data) {
        /* Create an alternative */

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
        setAlternativeSetInDOM(alternativeSet);

        // TODO : Manipulate DOM to populate container with alternatives
    }

    function setAlternativeSetInDOM(alternativeSet) {
        /*
         * Called by createAlternativeSet, this function sets the alternatives
         * in an alternative set in the DOM
         * 
         * Args:
         *  - alternativeSet: AlternativeSet object
         */

        // Create alternative set container <div>
        var alternativeSetAndTitleContainer = $("<div>");
        alternativeSetAndTitleContainer.attr({
            id: alternativeSet.id,
            class: "alternative-set-and-title-container"
        });
        alternativeSetAndTitleContainer.data("alternativeSet", alternativeSet);

        // Add empty cell for alternative set header
        // TODO : Set this header as a default title or a user-defined title
        alternativeSetAndTitleContainer = appendNewAlternativeSetTitleCell(alternativeSetAndTitleContainer, "Alternative Set");
        var alternativeSetContainer = $("<div>");
        alternativeSetContainer.attr({
            id: `flex-container-${alternativeSet.id}`,
            class: "alternative-set-container"
        })

        // Create alternative
        for (let i = 0; i < alternativeSet.alternatives.length; i++) {
            // alternative container <div>
            var alt = alternativeSet.alternatives[i];
            altElement = $("<div>").attr({
                id: alt.id,
                class: "alternative-container"
            });
            altElement.data("alternative", alt);
            altElement.addClass(alt.alternativeStatus);

            // alternative empty markdown cell
            altElement = appendNewAlternativeTitleCell(altElement, alt.alternativeTitle);
            altElement = appendNewCell("markdown", altElement);

            // Set title for first one
            altElement.children()

            alternativeSetContainer.append(altElement);
        }

        // Get selected cell and insert alternatives set and alternatives after
        var selectedCell = litUtils.retrieveLastSelectedCell();
        selectedCell = selectedCell.element // pull out element for jquery
        alternativeSetAndTitleContainer.append(alternativeSetContainer);
        alternativeSetAndTitleContainer.insertAfter(selectedCell)

    }

    function appendNewCell(type = "markdown", parentDiv) {
        /*
         * Append a new empty cell of specified type to
         * parent <div> given
         */


        // Create cell - code heavily adapted from:
        // git: jupyter/notebook/static/notebok/js/notebook.js.Notebook.prototype.insert_cell_at_index
        var nb = Jupyter.notebook;
        var cell_options = {
            events: nb.events,
            config: nb.config,
            keyboard_manager: nb.keyboard_manager,
            notebook: nb,
            tooltip: nb.tooltip
        };

        switch (type) {
            case 'code':
                var cell = new codecell.CodeCell(nb.kernel, cell_options);
                cell.set_input_prompt();
                break;
            case 'markdown':
                var cell = new textcell.MarkdownCell(cell_options);
                break;
            case 'raw':
                var cell = new textcell.RawCell(cell_options);
                break;
        }

        // Append to parent div
        $(parentDiv).append(cell.element);
        cell.metadata.alternativeID = $(parentDiv).data("alternative").id;

        // Follow up with rendering
        cell.render();
        nb.events.trigger("create.Cell", { "cell": cell, "index": 0 });
        cell.refresh();
        nb.set_dirty(true);

        return parentDiv;
    }

    function appendNewAlternativeTitleCell(parentDiv, title) {
        /*
         * Append a new empty cell of specified type to
         * parent <div> given
         */


        // Create cell - code heavily adapted from:
        // git: jupyter/notebook/static/notebok/js/notebook.js.Notebook.prototype.insert_cell_at_index
        var nb = Jupyter.notebook;
        var cell_options = {
            events: nb.events,
            config: nb.config,
            keyboard_manager: nb.keyboard_manager,
            notebook: nb,
            tooltip: nb.tooltip
        };

        var cell = new textcell.MarkdownCell(cell_options);
        cell.set_text(`### ${title}`);
        cell.metadata.alternativeTitle = title;
        cell.metadata.deletable = false;
        cell.metadata.alternativeID = $(parentDiv).data("alternative").id;

        // Append to parent div
        $(parentDiv).append(cell.element);

        // Follow up with rendering
        cell.render();
        nb.events.trigger("create.Cell", { "cell": cell, "index": 0 });
        cell.refresh();
        nb.set_dirty(true);

        return parentDiv;
    }

    function appendNewAlternativeSetTitleCell(parentDiv, title) {
        /*
         * Append a new empty cell of specified type to
         * parent <div> given
         */


        // Create cell - code heavily adapted from:
        // git: jupyter/notebook/static/notebok/js/notebook.js.Notebook.prototype.insert_cell_at_index
        var nb = Jupyter.notebook;
        var cell_options = {
            events: nb.events,
            config: nb.config,
            keyboard_manager: nb.keyboard_manager,
            notebook: nb,
            tooltip: nb.tooltip
        };

        var cell = new textcell.MarkdownCell(cell_options);
        cell.set_text(`### ${title}`);
        cell.metadata.alternativeSetTitle = title;
        cell.metadata.deletable = false;
        cell.metadata.alternativeSetID = $(parentDiv).data("alternativeSet").id;

        // Append to parent div
        $(parentDiv).append(cell.element);

        // Follow up with rendering
        cell.render();
        nb.events.trigger("create.Cell", { "cell": cell, "index": 0 });
        cell.refresh();
        nb.set_dirty(true);

        return parentDiv;
    }

    return {
        createAlternative: createAlternative,
        createAlternativeSet: createAlternativeSet,
        setAlternativeSetInDOM: setAlternativeSetInDOM
    };
});