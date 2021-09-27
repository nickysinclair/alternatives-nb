/**
 * Class acting as controller for handling user interactions from DOM and data
 * model interactions with JSON metadata.
 */

define([
    "jquery",
    "base/js/namespace",
    "notebook/js/cell",
    "notebook/js/codecell",
    "notebook/js/textcell",
    "../alternatives-nb/metadataModel",
    "../alternatives-nb/uuidv4",
    "../alternatives-nb/utils",
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
            /**
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

            if (data) {
                // Set default metadata
                if (!("id" in data)) {
                    // creating alternative from existing metadata
                    var defaultMetadata = metadataModel.setDefaultAlternativeMetadata();
                    Object.assign(this, defaultMetadata);
                    var updatedMetadata = metadataModel.updateAlternativeMetadata(
                        this.id,
                        data
                    );
                    Object.assign(this, updatedMetadata)
                } else {
                    Object.assign(this, data);
                }
            }

            return this;
        }

        setAlternativeElements(id = null) {
            /**  */

            // Alternative container
            var alternativeContainer = $("<div>")
                .prop("id", this.id)
                .addClass("alternative-container");
            alternativeContainer.data("alternative", this);
            alternativeContainer.addClass(
                litUtils.lowercaseFirstLetter(this.alternativeStatus)
            );

            if (!id) {
                // alternative title and empty markdown cells
                alternativeContainer = appendNewAlternativeTitleCell(
                    alternativeContainer,
                    this.alternativeTitle
                );
                alternativeContainer = appendNewCell("markdown", alternativeContainer);
            }

            // Hide archived alternatives on creation
            if (this.alternativeStatus == "Archived") {
                alternativeContainer.hide(0);
            }

            this.element = alternativeContainer;

            return alternativeContainer;
        }
    }

    class AlternativeSet {
        constructor(id = null) {
            /**
             * Set of Alternative objects
             */

            // Attaches AlternativeSet instances to Jupyter global for access convenience
            var alternativeSet = this;
            if (!Jupyter.alternativeSets) {
                Jupyter.alternativeSets = [];
            }
            Jupyter.alternativeSets.push(alternativeSet);

            this.alternatives = [];
            if (!id) {
                this.id = uuidv4();
                this.setAlternativeSetElements();
            } else {
                this.id = id;
                this.setAlternativeSetElements(this.id);
            }

            return this;
        }

        setAlternativeSetElements(id = null) {
            /**  */

            /**
             * ALTERNATIVE SET AND TITLE CONTAINER (AND TOOLBAR)
             * Inserted after selected cell
             */

            // Container for alternatives in set and the title cell
            var alternativeSetAndTitleContainer = $("<div>")
                .prop("id", this.id)
                .addClass("alternative-set-and-title-container");
            alternativeSetAndTitleContainer.data("alternativeSet", this);

            if (!id) {
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
            } else {
                $("#notebook-container").append(alternativeSetAndTitleContainer);
            }




            /**
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
            /** Set the toolbar - must be done after this.alternatives are set
             * to array of Alternative object instances]
             */

            /**
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
            var visibilityIcon = $("<i>")
                .addClass("fa-eye")
                .addClass("fa")
                .addClass("icon-toggle");
            var archiveIcon = $("<i>").addClass("fa-archive").addClass("fa");
            archiveBtnGroup.append(
                archiveBtn.append(visibilityIcon).append(archiveIcon)
            );
            alternativeSetToolbar.append(archiveBtnGroup);

            // INTERACTIVITY

            // When button is pressed, hide or show alternatives and change icon
            // Default is set to hide alternatives
            var thatAlternativeSet = this;
            archiveBtn.on("click", function() {
                let iconToggle = $("#toggle-archived-alternatives-btn > .icon-toggle");
                let visible = $(iconToggle).hasClass("fa-eye-slash");
                if (visible) {
                    for (let i = 0; i < thatAlternativeSet.alternatives.length; i++) {
                        if (
                            thatAlternativeSet.alternatives[i].alternativeStatus ===
                            "Archived"
                        ) {
                            $(`#${thatAlternativeSet.alternatives[i].id}`).hide(0);
                            $(`#${thatAlternativeSet.alternatives[i].id}`).addClass("hidden");
                        }
                    }
                    $(iconToggle).removeClass("fa-eye-slash");
                    $(iconToggle).addClass("fa-eye");
                } else {
                    for (let i = 0; i < thatAlternativeSet.alternatives.length; i++) {
                        if (
                            thatAlternativeSet.alternatives[i].alternativeStatus ===
                            "Archived"
                        ) {
                            $(`#${thatAlternativeSet.alternatives[i].id}`).show(0);
                            $(`#${thatAlternativeSet.alternatives[i].id}`).removeClass(
                                "hidden"
                            );
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
            /** Rearrange Alternatives in AlternativeSet */

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
            /** Expect an Array even if single alternative */

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
    }

    class AlternativeSetManager {
        constructor() {
            /**
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
        /** Create an alternative */

        return new Alternative(data);
    }

    function createAlternativeSet(data) {
        /**
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

    function lookupAlternativeSet(id) {
        return Jupyter.alternativeSets.filter((c, _) => c.id === id)[0];
    }

    function allSetAlternativesSelected(alternatives) {
        // Get AlternativeSet objects from alternatives and de-duplicate
        let alternativeSets = alternatives.map(function(a, _) {
            return lookupAlternativeSet(a.alternativeSet);
        });
        alternativeSets = Array.from(new Set(alternativeSets));
        // See if all alternatives in our sets are selected, and if so
        // set `hasAlternativeSets` flag to true
        let altSets = [];
        for (let i = 0; i < alternativeSets.length; i++) {
            let altSet = alternativeSets[i];
            if (altSet.alternatives.every((alt) => alternatives.includes(alt))) {
                altSets.push(altSet);
            }
        }
        return altSets;
    }

    function deleteAlternatives() {
        /**
         * Given selected cell(s), delete alternatives associated
         *
         * TODO : Add a dialog first into flow to confirm behavior?
         */

        // Get current selection and determine alternative + alternative set selection
        let selectedCells =
            $(".jupyter-soft-selected").length === 0 ?
            $(".selected") :
            $(".jupyter-soft-selected");
        let hasAlternatives = selectedCells
            .map(function(_, c) {
                return $(c).hasClass("alternative-title-cell");
            })
            .get()
            .includes(true);
        let hasAlternativeSets = selectedCells
            .map(function(_, c) {
                return $(c).hasClass("alternative-set-title-cell");
            })
            .get()
            .includes(true);

        let alternativeSets = [];
        let alternatives = [];
        if (hasAlternatives) {
            // Set alternative title cells to deletable
            let alternativeTitleCells = $(selectedCells).filter((_, c) =>
                $(c).hasClass("alternative-title-cell")
            );
            $(alternativeTitleCells).each(function(_, c) {
                $(c).data().cell.metadata.deletable = true;
            });

            // Get Alternative objects from title cells
            alternatives = alternatives.concat(
                $(alternativeTitleCells)
                .map(function(_, c) {
                    let alternative = $(c).parent().data().alternative;
                    return alternative;
                })
                .get()
            );

            // Get AlternativeSet objects implicitly selected by selecting all
            // their children
            alternativeSets = alternativeSets.concat(
                allSetAlternativesSelected(alternatives)
            );
            if (alternativeSets.length != 0) {
                hasAlternativeSets = true;
            }
        }
        if (hasAlternativeSets) {
            // Set alternative set title cells to deletable
            let alternativeSetTitleCells = $(selectedCells).filter((_, c) =>
                $(c).hasClass("alternative-set-title-cell")
            );
            $(alternativeSetTitleCells).each(function(_, c) {
                $(c).data().cell.metadata.deletable = true;
            });

            // Add AlternativeSet objects explicitly selected with set title cells
            alternativeSets = alternativeSets.concat(
                $(alternativeSetTitleCells)
                .map(function(_, c) {
                    let alternativeSet = $(c).parent().data().alternativeSet;
                    return alternativeSet;
                })
                .get()
            );
        }

        // Delete all selected cells
        for (let i = 0; i < selectedCells.length; i++) {
            let c = selectedCells[i];
            let index = Jupyter.notebook.find_cell_index($(c).data().cell);
            Jupyter.notebook.delete_cells([index]);
        }

        // Delete all selected alternatives
        for (let i = 0; i < alternatives.length; i++) {
            let alternative = alternatives[i];

            // Remove Alternative from AlternativeSet object
            let alternativeSet = lookupAlternativeSet(alternative.alternativeSet);
            let index = alternativeSet.alternatives.indexOf(alternative);
            alternativeSet.alternatives.splice(index, 1);

            // Remove from DOM
            $(alternative.element).remove();

            // Delete JSON metadata
            metadataModel.deleteAlternativeMetadata(alternative.id);
        }

        // Delete all selected alternative sets
        for (let i = 0; i < alternativeSets.length; i++) {
            let alternativeSet = alternativeSets[i];

            // Remove AlternativeSet object from global nb instance
            let index = Jupyter.alternativeSets.indexOf(alternativeSet);
            Jupyter.alternativeSets.splice(index, 1);

            // Remover from DOM
            $(alternativeSet.element).remove();

            // Delete JSON metadata
            // Should be completely done by alternative JSON pass and
            // this is extra, unnecessary pass
            for (let j = 0; j < alternativeSet.alternatives.length; j++) {
                let alternative = alternativeSet.alternatives[j];
                metadataModel.deleteAlternativeMetadata(alternative.id);
            }
        }
    }

    function setStatusChoice() {
        setAlternativesStatus("Choice");
    }

    function setStatusOption() {
        setAlternativesStatus("Option");
    }

    function setStatusArchived() {
        setAlternativesStatus("Archived");
    }

    function setAlternativesStatus(status) {
        /**
         * Set alternatives status: choice, option, archived
         */

        // Get selected cells
        let selectedCells =
            $(".jupyter-soft-selected").length === 0 ?
            $(".selected") :
            $(".jupyter-soft-selected");

        // Selected cells' parents
        let selectedParents = $(selectedCells).map(function(_, c) {
            return $(c).parent().get();
        });

        // Selected parents which are alternative containers
        let alternativeParents = selectedParents.filter((_, p) =>
            $(p).hasClass("alternative-container")
        );

        // De-duplicate
        alternativeParents = Array.from(new Set(alternativeParents));

        // Change status of alternatives and update metadata
        let alternatives = alternativeParents.map(function(p, _) {
            return $(p).data().alternative;
        });

        // Very hacky way to get the alternative set toolbar icon toggle class
        // properties given an alternative container
        // TODO : attach toolbar to AlternativeSet object as property and also
        // the archived toggle status and look that up from the alternative container
        // Alternative in `data`

        // Show/hide archived according to state of toggle
        let iconToggles = $(alternativeParents)
            .parent()
            .parent()
            .children(".alternative-set-toolbar")
            .children("#toggle-archived-alternatives-btn-group")
            .children("#toggle-archived-alternatives-btn")
            .children(".icon-toggle");

        // See whether toggle is set to visible for each alternative container
        // Note that we do not care about duplicates because we are setting
        // each alternative to hidden (or not) individually
        let visibles = $(iconToggles).map(function(_, i) {
            return $(i).hasClass("fa-eye-slash");
        });

        // Update DOM
        for (let i = 0; i < alternativeParents.length; i++) {
            let altParent = alternativeParents[i];
            let setParent = $(altParent).parent().parent().data().alternativeSet;

            // NOTE : $(".alternative-container.{status}") selector will not
            // work for nested alternatives

            switch (status) {
                case "Choice":
                    $(altParent).removeClass("option");
                    $(altParent).removeClass("archived");
                    $(`#${setParent.id} .alternative-container`).first().before(altParent);
                    $(altParent).addClass(litUtils.lowercaseFirstLetter(status));
                    break;
                case "Option":
                    $(altParent).removeClass("choice");
                    $(altParent).removeClass("archived");
                    if ($(`#${setParent.id} .alternative-container.choice`).length === 0) {
                        $(`#${setParent.id} .alternative-container`).first().before(altParent);
                    } else {
                        $(`#${setParent.id} .alternative-container.choice`).last().after(altParent);
                    }
                    $(altParent).addClass(litUtils.lowercaseFirstLetter(status));
                    break;
                case "Archived":
                    $(altParent).removeClass("choice");
                    $(altParent).removeClass("option");
                    if ($(`#${setParent.id} .alternative-container.archived`).length === 0) {
                        $(`#${setParent.id} .alternative-container`).last().after(altParent);
                    } else {
                        $(`#${setParent.id} .alternative-container.archived`).first().before(altParent);
                    }
                    $(altParent).addClass(litUtils.lowercaseFirstLetter(status));
                    if (!visibles[i]) {
                        $(altParent).hide(0);
                        $(altParent).addClass("hidden");
                    } else {
                        $(altParent).show(0);
                        $(altParent).removeClass("hidden");
                    }
                    break;
            }
        }

        // Update object and metadata status
        for (let i = 0; i < alternatives.length; i++) {
            let alternative = alternatives[i];
            alternative.alternativeStatus = status;
            metadataModel.updateAlternativeMetadata(alternative.id, {
                alternativeStatus: status,
            });
        }

        // Re-arrange order of alternatives
    }

    function appendNewCell(type = "markdown", parentDiv) {
        /**
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
        /**
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
        cell.metadata.alternativeTitle = true;
        cell.metadata.deletable = false;
        cell.metadata.alternativeID = $(parentDiv).data("alternative").id;

        // Append to parent div
        $(parentDiv).append(cell.element.addClass("alternative-title-cell"));

        // Follow up with rendering
        cell.render();
        nb.events.trigger("create.Cell", { cell: cell, index: 0 });
        cell.refresh();
        nb.set_dirty(true);

        return parentDiv;
    }

    function appendNewAlternativeSetTitleCell(parentDiv, title) {
        /**
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
        cell.metadata.alternativeSetTitle = true;
        cell.metadata.deletable = false;
        cell.metadata.alternativeSetID = $(parentDiv).data("alternativeSet").id;

        // Append to parent div
        $(parentDiv).append(cell.element.addClass("alternative-set-title-cell"));

        // Follow up with rendering
        cell.render();
        nb.events.trigger("create.Cell", { cell: cell, index: 0 });
        cell.refresh();
        nb.set_dirty(true);

        return parentDiv;
    }

    function renderAlternativesFromJSON() {
        /**
         * After completion of notebook.load_notebook_success,
         * create elements and objects to place cells into
         */

        /**
         * Get metadata and transform into structured set
         * of alternative sets and alternatives
         */
        /** Example of structure
         * {
         *  ' alternativeSet':
         *      [
         *          {   
         *              "alternativeChildren": [],
         *              "alternativeParent": "",
         *              "alternativeReasoning": {
         *                  "alternativesTrigger": [],
         *                  "decisionRationale": []
         *              },
         *              "alternativeStatus": "Option",
         *              "alternativeTitle": "Untitled Alternative 1",
         *              "alternativeSet": "812cc15c-15d1-4af1-a614-49d595f1b34d",
         *              "id": "ef8f7519-d827-43fe-ac77-0de66439f0c8"
         *          },
         *          {   
         *              "alternativeChildren": [],
         *              "alternativeParent": "",
         *              "alternativeReasoning": {
         *                  "alternativesTrigger": [],
         *                  "decisionRationale": []
         *              },
         *              "alternativeStatus": "Option",
         *              "alternativeTitle": "Untitled Alternative 1",
         *              "alternativeSet": "812cc15c-15d1-4af1-a614-49d595f1b34d",
         *              "id": "ef8f7519-d827-43fe-ac77-0de66439f0c8"
         *          }
         *      ]
         *  'alternativeSet2':
         *      [ ... ]
         * }
         */
        let metadata = Jupyter.notebook.metadata;
        // If there are no cells with alternativeSetID metadata, assume we don't have any alternatives
        // and don't try to render them
        if (Jupyter.notebook.get_cells().filter((c, _) => "alternativeSetID" in c.metadata).length === 0) {
            return;
        }
        let alternativesMetadata = metadata.lit.alternatives;
        let alternativeSets = {};
        for (let i = 0; i < alternativesMetadata.length; i++) {
            let alternative = alternativesMetadata[i];

            // Add alternative set if not existing
            if (!(alternative.alternativeSet in alternativeSets)) {
                alternativeSets[alternative.alternativeSet] = [];
            }

            // Add alternative data and delete alternative set from data Object
            alternativeSets[alternative.alternativeSet].push(alternative);
            //delete alternativeSets[alternative.alternativeSet][alternativeSets[alternative.alternativeSet].length - 1].alternativeSet
        }
        Jupyter.alternativeSetsMetadata = alternativeSets;

        /**
         * Lay out the alternative sets and alternatives through
         * approach which iterates all cells and inserts elements and creates objects
         * when encountering cells requiring placement
         */

        let cells = Jupyter.notebook.get_cells();
        let alternatives = [];
        for (let i = 0; i < cells.length; i++) {
            let cell = cells[i];
            let cm = cell.metadata;
            if (cm.alternativeSetTitle) {
                // Create the alternative set object and insert into DOM
                let alternativeSet = new AlternativeSet(cm.alternativeSetID);

                // Add cell into alternative set in DOM
                $(`#${cm.alternativeSetID}`).prepend(cell.element.addClass("alternative-set-title-cell"));
                continue;
            } else if (cm.alternativeTitle) {
                // Create the alternative object, add as alternative set property, and insert into DOM
                let data = {};
                for (var key in alternativeSets) {
                    for (var j = 0; j < alternativeSets[key].length; j++) {
                        if (cm.alternativeID === alternativeSets[key][j].id) {
                            data = alternativeSets[key][j];
                        }
                    }
                }

                let alternative = new Alternative(data);
                alternatives.push(alternative);

                alternative.setAlternativeElements(cm.alternativeID);
                $(`#${alternative.alternativeSet} .alternative-set-container`)
                    .append(alternative.element);

                // Add cell into alternative in DOM
                $(`#${cm.alternativeID}`).prepend(cell.element.addClass("alternative-title-cell"));
                continue;
            } else if (cm.alternativeID !== undefined) {
                // Add cell to alternative container in DOM
                $(`#${cm.alternativeID}`).append(cell.element);
                continue;
            } else {
                $("#notebook-container").append(cell.element);
                continue;
            }
        }

        // set alternatives to alternative sets
        for (let i = 0; i < alternatives.length; i++) {
            let alternative = alternatives[i];
            let alternativeSetID = alternative.alternativeSet;
            for (let j = 0; j < Jupyter.alternativeSets.length; j++) {
                if (alternativeSetID === Jupyter.alternativeSets[j].id) {
                    Jupyter.alternativeSets[j].alternatives.push(alternative);
                }
            }
        }

        // set alternative set toolbars afterwards
        for (let i = 0; i < Jupyter.alternativeSets.length; i++) {
            Jupyter.alternativeSets[i].setAlternativeSetToolbar();
        }
    }

    return {
        createAlternative: createAlternative,
        createAlternativeSet: createAlternativeSet,
        deleteAlternatives: deleteAlternatives,
        setStatusChoice: setStatusChoice,
        setStatusOption: setStatusOption,
        setStatusArchived: setStatusArchived,
        renderAlternativesFromJSON: renderAlternativesFromJSON
    };
});