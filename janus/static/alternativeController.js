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

        deleteAlternatives(deleteAlternatives) {
            /* 
             * Delete the alternatives objects from alternative set and 
             * metadata
             * 
             * Args:
             *  - deleteAlternatives: Array of Alternative objects
             */

            var newAlternatives = [];
            for (let i = 0; i < this.alternatives.length; i++) {
                var alt = this.alternatives[i];
                // If the alternative is to be deleted, modify JSON
                // If not to be deleted, add it to keepers' list
                if (deleteAlternatives.includes(alt)) {
                    metadataModel.deleteAlternativeMetadata(alt.id);
                } else {
                    newAlternatives.push(alt);
                }
            }
            this.alternatives = newAlternatives;
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

    function deleteAlternatives() {
        /* 
         * Given selected cell(s), delete alternatives associated
         * 
         * TODO : Add a dialog first into flow to confirm behavior?
         */

        // Get selected alternatives of selected cells
        var nb = Jupyter.notebook;
        var selectedCells = nb.get_selected_cells();
        var selectedAlternatives = selectedCells.map(function(c) {
            return c.metadata.alternativeID;
        });

        // Remove selected alternatives' duplicates/undefined
        selectedAlternatives = Array.from(new Set(selectedAlternatives));
        selectedAlternatives = selectedAlternatives.filter(e => e != undefined);

        // For selected alternatives, unlock title cells to be deletable
        for (let i = 0; i < selectedCells.length; i++) {
            var sc = selectedCells[i];
            if (selectedAlternatives.includes(sc.metadata.alternativeID) &&
                sc.metadata.deletable === false) {
                sc.metadata.deletable = true;
            }
        }

        // Capture set if all alternatives in a set are to be deleted
        alternativeSetsDelete = [];
        for (let i = 0; i < selectedAlternatives.length; i++) {
            var sa = selectedAlternatives[i];
            var saSiblings = $(`#${sa}`).siblings();

            // See if all this alternative's siblings are in the selection
            // Apply condition to return boolean and then `every` returns true
            // if all are true
            var allSibsSelected = saSiblings.map(function(_, s) {
                return selectedAlternatives.includes(s.id);
            }).get().every(bool => bool);

            if (allSibsSelected) {
                var alternativeSetID = $(`#${sa}`).parent().parent().data().alternativeSet.id;
                alternativeSetsDelete.push(alternativeSetID);
            }
        }
        // Remove alternative set duplicates
        alternativeSetsDelete = Array.from(new Set(alternativeSetsDelete));

        // For captured alternative sets, unlock title cells to be deletable
        for (let i = 0; i < alternativeSetsDelete.length; i++) {
            var setTitleCell = $(`#${alternativeSetsDelete[0]}`).children(".cell").data().cell;
            setTitleCell.metadata.deletable = true;
        }

        // Delete selected cells
        nb.delete_cells(nb.get_selected_cells_indices());

        // TODO : Delete unselected cells that are in alternative

        // TODO : Delete alternatives from DOM irrespective of alternative set

        // Remove the alternative set and all its children
        for (let i = 0; i < alternativeSetsDelete.length; i++) {
            var altSet = alternativeSetsDelete[i];
            var altSetObj = $(`#${altSet}`).data().alternativeSet;

            // Remove from DOM
            $(`#${altSet}`).remove();

            // Delete alternatives from set object and also JSON data
            altSetObj.deleteAlternatives(altSetObj.alternatives);

            // No need to delete alternative set object
            // TODO : Better OOP would be an object manages alternative sets 
            // and explicitly deletes
        }
    }

    function alternativesFromJSON() {
        /*  */


    }

    return {
        createAlternative: createAlternative,
        createAlternativeSet: createAlternativeSet,
        setAlternativeSetInDOM: setAlternativeSetInDOM,
        deleteAlternatives: deleteAlternatives
    };
});