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
], function(
    $,
    Jupyter,
    cell,
    codecell,
    textcell,
    metadataModel,
    uuidv4,
    litUtils
) {
    class Alternative {
        constructor(data = null) {
            /*
             * Alternative
             *
             * Args:
             *  - data: `data` from view saved in Models and rendering UI
             */

            // Attaches Alternative instances to Jupyter global for access convenience
            var alternative = this;
            if (!Jupyter.alternatives) {
                Jupyter.alternatives = [];
            }
            Jupyter.alternatives.push(alternative);

            // Set default metadata
            var defaultMetadata = metadataModel.setDefaultAlternativeMetadata();
            Object.assign(this, defaultMetadata);

            // Update metadata with data if given
            if (data) {
                var updatedMetadata = metadataModel.updateAlternativeMetadata(
                    this.id,
                    data
                );
                Object.assign(this, updatedMetadata);
            }

            return this;
        }

        setAlternativeElements() {
            /*  */

            // Alternative container
            var alternativeContainer = $("<div>")
                .prop("id", this.id)
                .addClass("alternative-container");
            alternativeContainer.data("alternative", this);
            alternativeContainer.addClass(
                litUtils.lowercaseFirstLetter(this.alternativeStatus)
            );

            // alternative title and empty markdown cells
            alternativeContainer = appendNewAlternativeTitleCell(
                alternativeContainer,
                this.alternativeTitle
            );
            alternativeContainer = appendNewCell("markdown", alternativeContainer);

            // Hide archived alternatives on creation
            if (this.alternativeStatus == "Archived") {
                alternativeContainer.hide(0);
            }

            this.element = alternativeContainer;

            return alternativeContainer;
        }
    }

    class AlternativeSet {
        constructor() {
            /*
             * Set of Alternative objects
             */

            // Attaches AlternativeSet instances to Jupyter global for access convenience
            var alternativeSet = this;
            if (!Jupyter.alternativeSets) {
                Jupyter.alternativeSets = [];
            }
            Jupyter.alternativeSets.push(alternativeSet);

            this.id = uuidv4();
            this.alternatives = [];
            this.setAlternativeSetElements();

            return this;
        }

        setAlternativeSetElements() {
            /*  */

            /*
             * ALTERNATIVE SET AND TITLE CONTAINER (AND TOOLBAR)
             * Inserted after selected cell
             */

            // Container for alternatives in set and the title cell
            var alternativeSetAndTitleContainer = $("<div>")
                .prop("id", this.id)
                .addClass("alternative-set-and-title-container");
            alternativeSetAndTitleContainer.data("alternativeSet", this);

            // Place alternative set and title container in DOM after existing cell
            var selectedCell = litUtils.retrieveLastSelectedCell();
            selectedCell = selectedCell.element; // pull out element for jquery
            alternativeSetAndTitleContainer.insertAfter(selectedCell);

            // Add empty cell for alternative set header
            // TODO : Set this header as a default title or a user-defined title
            alternativeSetAndTitleContainer = appendNewAlternativeSetTitleCell(
                alternativeSetAndTitleContainer,
                "Alternative Set"
            );


            /* 
             * ALTERNATIVES CONTAINER (WITHIN ALTERNATIVE SET)
             */

            // Container for alternatives in set
            var alternativeSetContainer = $("<div>")
                .prop("id", `flex-container-${this.id}`)
                .addClass("alternative-set-container");

            // Attach and save as object instance property
            alternativeSetAndTitleContainer.append(alternativeSetContainer);
            this.element = alternativeSetAndTitleContainer;
        }

        setAlternativeSetToolbar() {
            /* Set the toolbar - must be done after this.alternatives are set
             * to array of Alternative object instances]
             */

            /*
             * ALTERNATIVE SET TOOLBAR WITH BUTTONS
             * 
             */

            // Add a toolbar for archiving/un-archiving alternatives, etc.
            var alternativeSetToolbar = $("<div>")
                .prop("id", `toolbar-${this.id}`)
                .addClass("alternative-set-toolbar");

            // Archiving toggle hide/show
            var archiveBtnGroup = $("<div>")
                .prop("id", "toggle-archived-alternatives-btn-group")
                .addClass("btn-group");
            var archiveBtn = $("<button>")
                .prop("id", "toggle-archived-alternatives-btn")
                .prop("title", "Toggle Archived Alternatives")
                .addClass("btn")
                .addClass("btn-default");
            var visibilityIcon = $("<i>").addClass("fa-eye").addClass("fa").addClass("icon-toggle");
            var archiveIcon = $("<i>").addClass("fa-archive").addClass("fa");
            archiveBtnGroup.append(archiveBtn.append(visibilityIcon).append(archiveIcon));
            alternativeSetToolbar.append(archiveBtnGroup)

            // INTERACTIVITY

            // When button is pressed, hide or show alternatives and change icon
            // Default is set to hide alternatives
            var thatAlternativeSet = this;
            archiveBtn.on("click", function() {
                let iconToggle = $("#toggle-archived-alternatives-btn > .icon-toggle");
                let visible = $(iconToggle).hasClass("fa-eye-slash");
                if (visible) {
                    for (let i = 0; i < thatAlternativeSet.alternatives.length; i++) {
                        if (thatAlternativeSet.alternatives[i].alternativeStatus === "Archived") {
                            $(`#${thatAlternativeSet.alternatives[i].id}`).hide(0);
                            $(`#${thatAlternativeSet.alternatives[i].id}`).addClass("hidden");
                        }
                    }
                    $(iconToggle).removeClass("fa-eye-slash");
                    $(iconToggle).addClass("fa-eye");
                } else {
                    for (let i = 0; i < thatAlternativeSet.alternatives.length; i++) {
                        if (thatAlternativeSet.alternatives[i].alternativeStatus === "Archived") {
                            $(`#${thatAlternativeSet.alternatives[i].id}`).show(0);
                            $(`#${thatAlternativeSet.alternatives[i].id}`).removeClass("hidden");
                        }
                    }
                    $(iconToggle).removeClass("fa-eye");
                    $(iconToggle).addClass("fa-eye-slash");
                }
            });

            // Append toolbar to set and title (and toolbar) container
            $(alternativeSetToolbar).insertAfter(`#${this.id} > .cell`);

        }

        arrangeAlternativesStatus() {
            /* Rearrange Alternatives in AlternativeSet */

            var choiceAlternatives = [];
            var optionAlternatives = [];
            var archivedAlternatives = [];
            for (let i = 0; i < this.alternatives.length; i++) {
                var thatAlternative = this.alternatives[i];
                switch (thatAlternative.alternativeStatus) {
                    case "Choice":
                        choiceAlternatives.push(thatAlternative);
                        break;
                    case "Option":
                        optionAlternatives.push(thatAlternative);
                        break;
                    case "Archived":
                        archivedAlternatives.push(thatAlternative);
                        break;
                }
            }
            var arrangedAlternatives = choiceAlternatives
                .concat(optionAlternatives)
                .concat(archivedAlternatives);
            this.alternatives = arrangedAlternatives;
        }

        setAlternatives(newAlternatives) {
            /* Expect an Array even if single alternative */

            // Save alternatives to AlternativeSet property and then rearrange per status
            for (let i = 0; i < newAlternatives.length; i++) {
                this.alternatives.push(newAlternatives[i]);
            }
            this.arrangeAlternativesStatus();

            // Create alternative elements
            var alternativeContainers = [];
            for (let i = 0; i < this.alternatives.length; i++) {
                let alternative = this.alternatives[i];
                alternativeContainers.push(alternative.setAlternativeElements());
            }

            // And append alternative elements to alternative set container
            var alternativeSetContainer = $(`#${this.id} .alternative-set-container`);
            for (let i = 0; i < alternativeContainers.length; i++) {
                $(alternativeSetContainer).append(alternativeContainers[i]);
            }
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

    class AlternativeSetManager {
        constructor() {
            /*
             * Managing AlternativeSet objects
             *
             * Not currently used
             * TODO : Implement this if it is useful
             */

            // Attaches AlternativeSet instances to Jupyter global for access convenience
            var alternativeSetManager = this;
            if (!Jupyter.alternativeSetManagers) {
                Jupyter.alternativeSetManagers = [];
            }
            Jupyter.alternativeSetManagers.push(alternativeSetManager);

            this.id = uuidv4();
            this.alternativeSets = [];

            return this;
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

        // TODO : Set alternativeParent by requesting DOM for whether current
        // cell is within an alternative

        // Create Alternative object instances
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
        alternativeSet.setAlternatives(alternatives);

        alternativeSet.setAlternativeSetToolbar();
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
        selectedAlternatives = selectedAlternatives.filter((e) => e != undefined);

        // For selected alternatives, unlock title cells to be deletable
        for (let i = 0; i < selectedCells.length; i++) {
            var sc = selectedCells[i];
            if (
                selectedAlternatives.includes(sc.metadata.alternativeID) &&
                sc.metadata.deletable === false
            ) {
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
            var allSibsSelected = saSiblings
                .map(function(_, s) {
                    return selectedAlternatives.includes(s.id);
                })
                .get()
                .every((bool) => bool);

            if (allSibsSelected) {
                var alternativeSetID = $(`#${sa}`).parent().parent().data()
                    .alternativeSet.id;
                alternativeSetsDelete.push(alternativeSetID);
            }
        }
        // Remove alternative set duplicates
        alternativeSetsDelete = Array.from(new Set(alternativeSetsDelete));

        // For captured alternative sets, unlock title cells to be deletable
        for (let i = 0; i < alternativeSetsDelete.length; i++) {
            var setTitleCell = $(`#${alternativeSetsDelete[0]}`)
                .children(".cell")
                .data().cell;
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
            tooltip: nb.tooltip,
        };

        switch (type) {
            case "code":
                var cell = new codecell.CodeCell(nb.kernel, cell_options);
                cell.set_input_prompt();
                break;
            case "markdown":
                var cell = new textcell.MarkdownCell(cell_options);
                break;
            case "raw":
                var cell = new textcell.RawCell(cell_options);
                break;
        }

        // Append to parent div
        $(parentDiv).append(cell.element);
        cell.metadata.alternativeID = $(parentDiv).data("alternative").id;

        // Follow up with rendering
        cell.render();
        nb.events.trigger("create.Cell", { cell: cell, index: 0 });
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
            tooltip: nb.tooltip,
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
        nb.events.trigger("create.Cell", { cell: cell, index: 0 });
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
            tooltip: nb.tooltip,
        };

        var cell = new textcell.MarkdownCell(cell_options);
        cell.set_text(`## ${title}`);
        cell.metadata.alternativeSetTitle = title;
        cell.metadata.deletable = false;
        cell.metadata.alternativeSetID = $(parentDiv).data("alternativeSet").id;

        // Append to parent div
        $(parentDiv).append(cell.element);

        // Follow up with rendering
        cell.render();
        nb.events.trigger("create.Cell", { cell: cell, index: 0 });
        cell.refresh();
        nb.set_dirty(true);

        return parentDiv;
    }

    function alternativesFromJSON() {
        /*  */
    }

    return {
        createAlternative: createAlternative,
        createAlternativeSet: createAlternativeSet,
        deleteAlternatives: deleteAlternatives,
    };
});