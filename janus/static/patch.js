/*
Janus: Jupyter Notebook extension that helps users keep clean notebooks by
hiding cells and tracking changes
*/

define([
    "jquery",
    "base/js/namespace",
    "base/js/events",
    "notebook/js/cell",
    "notebook/js/codecell",
    "notebook/js/textcell",
    "../janus/utils",
], function($, Jupyter, events, Cell, CodeCell, TextCell, JanusUtils) {
    // TODO patchSplitCell is a pretty involved patch, see if we can be less invasive
    // TODO patchSplitCell on hidden output causes simple cell copy, not split; more
    // thorough QA necessary to reveal other bugs
    // TODO the 'cut_cell' function calls the copy function, so for now cut
    // actions will be tracked twice, and data need to be cleaned later

    // PATCH CELL FUNCTIONS
    function patchCellSelect() {
        /* patch cell selection to handle sidebar highlighting */

        var oldCellSelect = Cell.Cell.prototype.select;
        Cell.Cell.prototype.select = function() {
            // unselect all cells in the sidebar
            if (!Jupyter.sidebar.collapsed) {
                var sections = Jupyter.sidebar.sections;
                for (var i = 0; i < sections.length; i++) {
                    var secCells = sections[i].cells;
                    for (var j = 0; j < secCells.length; j++) {
                        secCells[j].selected = false;
                        secCells[j].element.removeClass("selected");
                        secCells[j].element.addClass("unselected");
                    }
                }
            }

            if (this.metadata.janus.cell_hidden) {
                // highlight the correct placeholder
                $(".hide-container.selected").removeClass("selected");
                $(this.element).nextAll(".hide-container").first().addClass("selected");
                if (this.nb_cell) {
                    $(this.nb_cell.element)
                        .nextAll(".hide-container")
                        .first()
                        .addClass("selected");
                }
            } else {
                $(".hide-container").removeClass("selected");
            }

            // if this cell is hidden, select the proper cell in the sidebar
            if (
                this.metadata.janus.cell_hidden ||
                this.metadata.janus.source_hidden ||
                this.metadata.janus.output_hidden
            ) {
                // TODO find more robust way to find placeholder associated with the cell
                $(this.element).nextAll(".hide-marker").first().addClass("active");
                if (!Jupyter.sidebar.collapsed && this.sb_cell != undefined) {
                    this.sb_cell.selected = true;
                    this.sb_cell.select();
                    this.sb_cell.element.removeClass("unselected");
                    this.sb_cell.element.addClass("selected");
                }
            }

            // do the normal cell selection
            oldCellSelect.apply(this, arguments);

            Jupyter.sidebar.startRepositionTimer();
        };
    }

    function patchCellUnselect() {
        /* Track when cells are edited and unselected before being executed

                This can help us reconstruct the whole nb history, including edits that
                change a cell's content and are saved, but not executed
                */

        var oldCellUnselect = Cell.Cell.prototype.unselect;
        Cell.Cell.prototype.unselect = function() {
            // need to return context object so i-cell selection works
            var cont = oldCellUnselect.apply(this, arguments);

            // update version markers, but don't think we need to do this will another cell being selected
            var janus_meta = this.metadata.janus;
            if (
                (janus_meta.cell_hidden ||
                    janus_meta.source_hidden ||
                    janus_meta.output_hidden) &&
                !Jupyter.sidebar.collapsed &&
                this.sb_cell
            ) {
                this.set_text(this.sb_cell.get_text());
            }

            return cont;
        };
    }

    function patchToMarkdown() {
        /* ensure new cells have a unique janus id and sidebar updates

                Jupyter converts to markdown by creating an entirely new cell
                Make sure this new cell has a new cell id
                */

        var oldToMarkdown = Jupyter.notebook.__proto__.to_markdown;
        Jupyter.notebook.__proto__.to_markdown = function() {
            oldToMarkdown.apply(this, arguments);

            //
            var selCells = Jupyter.notebook.get_selected_cells();
            for (var i = 0; i < selCells.length; i++) {
                selCells[i].metadata.janus.id = Math.random().toString(16).substring(2);
            }

            // update the sidebar
            Jupyter.sidebar.updateHiddenCells();

            // render and focus markdown cell
            if (!Jupyter.sidebar.collapsed) {
                for (var i = 0; i < selCells.length; i++) {
                    if (selCells[i].sb_cell) {
                        selCells[i].sb_cell.unrender();
                    }
                }
                if (selCells[0].sb_cell) {
                    selCells[0].sb_cell.focus_editor();
                }
            }
        };
    }

    function patchToCode() {
        /* ensure new cells have a unique janus id and sidebar updates


                Jupyter converts to code by creating an entirely new cell
                Make sure this new cell has a new cell id
                */
        var oldToCode = Jupyter.notebook.__proto__.to_code;
        Jupyter.notebook.__proto__.to_code = function() {
            oldToCode.apply(this, arguments);

            selCells = Jupyter.notebook.get_selected_cells();
            for (var i = 0; i < selCells.length; i++) {
                selCells[i].metadata.janus.id = Math.random().toString(16).substring(2);
            }

            // update the sidebar
            Jupyter.sidebar.updateHiddenCells();

            // select the first cell in the sidebar
            if (selCells[0].sb_cell) {
                selCells[0].sb_cell.focus_editor();
            }
        };
    }

    function patchCodeExecute() {
        /* execute main cell using sidebar text, then update sidebar cell */

        var oldCodeCellExecute = CodeCell.CodeCell.prototype.execute;
        CodeCell.CodeCell.prototype.execute = function() {
            var that = this;

            // function to run once cell is executed
            function updateCellOnExecution(evt) {
                if (that.sb_cell) {
                    that.sb_cell.fromJSON(that.toJSON());
                }
                events.off("kernel_idle.Kernel", updateCellOnExecution);
            }

            // run hidden cells with text from the sidebar, then update sidebar
            var janusMeta = this.metadata.janus;
            if (
                (janusMeta.cell_hidden || janusMeta.source_hidden) &&
                this.sb_cell != undefined
            ) {
                this.set_text(this.sb_cell.get_text());
                oldCodeCellExecute.apply(this, arguments);
                that.sb_cell.clear_output();
                this.sb_cell.set_input_prompt("*");
                events.on("kernel_idle.Kernel", updateCellOnExecution);
            } else if (janusMeta.output_hidden && this.sb_cell != undefined) {
                oldCodeCellExecute.apply(this, arguments);
                that.sb_cell.clear_output();
                events.on("kernel_idle.Kernel", updateCellOnExecution);
            } else {
                oldCodeCellExecute.apply(this, arguments);
                events.on("kernel_idle.Kernel", updateCellOnExecution);
            }

            if (
                (janusMeta.cell_hidden || janusMeta.source_hidden) &&
                Jupyter.sidebar.collapsed
            ) {
                $(this.element)
                    .nextAll(".hide-container")
                    .first()
                    .children(".hide-spacer")
                    .first()
                    .html("[*]:");
            }
        };
    }

    function patchHandleExecuteReply() {
        /* Update the prompt numbers on the sidebar when cell is executing */

        var oldHandleExecuteReply =
            CodeCell.CodeCell.prototype._handle_execute_reply;
        CodeCell.CodeCell.prototype._handle_execute_reply = function() {
            oldHandleExecuteReply.apply(this, arguments);

            if (this.sb_cell) {
                this.sb_cell.set_input_prompt(this.input_prompt_number);
                this.sb_cell.fromJSON(this.toJSON());
            }
            if (
                (this.metadata.janus.cell_hidden ||
                    this.metadata.janus.source_hidden) &&
                Jupyter.sidebar.collapsed
            ) {
                $(this.element)
                    .nextAll(".hide-container")
                    .first()
                    .children(".hide-spacer")
                    .first()
                    .html("");
            }
        };
    }

    function patchTextRender() {
        /* render main cell using sidebar text, then update sidebar cell */

        var oldTextCellRender = TextCell.MarkdownCell.prototype.render;

        TextCell.MarkdownCell.prototype.render = function() {
            // seems to be an issue with new cell having metadata
            generateDefaultCellMetadata(this);

            if (this.metadata.janus.cell_hidden && this.sb_cell != undefined) {
                this.set_text(this.sb_cell.get_text());
                oldTextCellRender.apply(this, arguments);
                this.sb_cell.fromJSON(this.toJSON());
            } else {
                oldTextCellRender.apply(this, arguments);
            }
        };
    }

    // PATCH notebook FUNCTIONS
    function patchInsertCellAtIndex() {
        /* ensure new cells have a unique janus id and sidebar updates */

        var oldInsertCellAtIndex = Jupyter.notebook.__proto__.insert_cell_at_index;
        Jupyter.notebook.__proto__.insert_cell_at_index = function() {
            c = oldInsertCellAtIndex.apply(this, arguments);

            // if creating a new cell after a hidden one, make new cell hidden
            generateDefaultCellMetadata(c);

            curMetadata = Jupyter.notebook.get_selected_cell().metadata;
            if (curMetadata.janus.cell_hidden) {
                c.metadata.janus.cell_hidden = true;
                Jupyter.sidebar.updateHiddenCells();
            }

            // make sure to return the new cell as other functions us it
            return c;
        };
    }

    function patchMoveSelectionUp() {
        /* Update sidebar after the move */

        var oldMoveSelectionUp = Jupyter.notebook.__proto__.move_selection_up;
        Jupyter.notebook.__proto__.move_selection_up = function() {
            oldMoveSelectionUp.apply(this, arguments);
            Jupyter.sidebar.updateHiddenCells();
        };
    }

    function patchMoveSelectionDown() {
        /* Update sidebar after the move */

        var oldMoveSelectionDown = Jupyter.notebook.__proto__.move_selection_down;
        Jupyter.notebook.__proto__.move_selection_down = function() {
            oldMoveSelectionDown.apply(this, arguments);
            Jupyter.sidebar.updateHiddenCells();
        };
    }

    function patchMergeCellAbove() {
        /* Update sidebar after the merge */

        var oldMergeCellAbove = Jupyter.notebook.__proto__.merge_cell_above;
        Jupyter.notebook.__proto__.merge_cell_above = function() {
            oldMergeCellAbove.apply(this, arguments);
            Jupyter.sidebar.updateHiddenCells();
        };
    }

    function patchMergeCellBelow() {
        /* Update sidebar after the merge */
        var oldMergeCellBelow = Jupyter.notebook.__proto__.merge_cell_below;
        Jupyter.notebook.__proto__.merge_cell_below = function() {
            oldMergeCellBelow.apply(this, arguments);
            Jupyter.sidebar.updateHiddenCells();
        };
    }

    function patchDeleteCells() {
        /* Update sidebar after the deletion */

        var oldDeleteCells = Jupyter.notebook.__proto__.delete_cells;
        Jupyter.notebook.__proto__.delete_cells = function() {
            oldDeleteCells.apply(this, arguments);
            Jupyter.sidebar.updateHiddenCells();
        };
    }

    function patchSplitCell() {
        /* ensure split cells have a unique janus id and sidebar updates */

        var oldSplitCell = Jupyter.notebook.__proto__.split_cell;
        Jupyter.notebook.__proto__.split_cell = function() {
            var cell = Jupyter.notebook.get_selected_cell();
            if (cell.metadata.janus.cell_hidden) {
                if (cell.sb_cell.is_splittable()) {
                    var texta = cell.sb_cell.get_pre_cursor();
                    var textb = cell.sb_cell.get_post_cursor();

                    // current cell becomes the second one
                    // so we don't need to worry about selection
                    cell.set_text(textb);

                    // create new cell with same type
                    var new_cell = Jupyter.notebook.insert_cell_above(cell.cell_type);

                    // Unrender the new cell so we can call set_text.
                    new_cell.unrender();
                    new_cell.set_text(texta);

                    // set new sidebar cell metadata
                    new_cell.metadata.janus = JSON.parse(
                        JSON.stringify(cell.metadata.janus)
                    );
                    new_cell.metadata.janus.id = Math.random().toString(16).substring(2);
                }

                // update the sidebar
                Jupyter.sidebar.updateHiddenCells();
            } else {
                oldSplitCell.apply(this, arguments);
            }
        };
    }

    function patchCutCopyPaste() {
        /* Track when cells are cut, copied, and pasted

                Primarily listening to cut/copy/paste so we can save action data
                */

        // First, patch action initiated by the notebook
        var oldCut = Jupyter.notebook.__proto__.cut_cell;
        var oldCopy = Jupyter.notebook.__proto__.copy_cell;
        var oldPasteReplace = Jupyter.notebook.__proto__.paste_cell_replace;
        var oldPasteAbove = Jupyter.notebook.__proto__.paste_cell_above;
        var oldPasteBelow = Jupyter.notebook.__proto__.paste_cell_below;

        Jupyter.notebook.__proto__.cut_cell = function() {
            var ts = JanusUtils.getTimeAndSelection();
            oldCut.apply(this, arguments);
        };

        Jupyter.notebook.__proto__.copy_cell = function() {
            var ts = JanusUtils.getTimeAndSelection();
            oldCopy.apply(this, arguments);
        };

        Jupyter.notebook.__proto__.paste_cell_replace = function() {
            var ts = JanusUtils.getTimeAndSelection();
            oldPasteReplace.apply(this, arguments);
        };

        Jupyter.notebook.__proto__.paste_cell_above = function() {
            var ts = JanusUtils.getTimeAndSelection();
            oldPasteAbove.apply(this, arguments);
        };

        Jupyter.notebook.__proto__.paste_cell_below = function() {
            var ts = JanusUtils.getTimeAndSelection();
            oldPasteBelow.apply(this, arguments);
        };

        // Next, listen for browser-initiated (e.g. hotkey) cut, copy, paste events
        document.addEventListener("cut", function() {
            if (Jupyter.notebook.mode == "command") {
                var ts = JanusUtils.getTimeAndSelection();
            }
        });

        document.addEventListener("copy", function() {
            if (Jupyter.notebook.mode == "command") {
                var ts = JanusUtils.getTimeAndSelection();
            }
        });

        document.addEventListener("paste", function() {
            if (Jupyter.notebook.mode == "command") {
                var ts = JanusUtils.getTimeAndSelection();
            }
        });
    }

    function patchPasteCellAbove() {
        /* ensure pasted cells have a unique janus id and sidebar updates */

        var oldPasteCellAbove = Jupyter.notebook.__proto__.paste_cell_above;
        Jupyter.notebook.__proto__.paste_cell_above = function() {
            for (var i = 0; i < Jupyter.notebook.clipboard.length; i++) {
                Jupyter.notebook.clipboard[i].metadata.janus.id = Math.random()
                    .toString(16)
                    .substring(2);
            }
            oldPasteCellAbove.apply(this, arguments);
            Jupyter.sidebar.updateHiddenCells();
        };
    }

    function patchPasteCellBelow() {
        /* ensure pasted cells have a unique janus id and sidebar updates */

        var oldPasteCellBelow = Jupyter.notebook.__proto__.paste_cell_below;
        Jupyter.notebook.__proto__.paste_cell_below = function() {
            for (var i = 0; i < Jupyter.notebook.clipboard.length; i++) {
                Jupyter.notebook.clipboard[i].metadata.janus.id = Math.random()
                    .toString(16)
                    .substring(2);
            }
            oldPasteCellBelow.apply(this, arguments);
            Jupyter.sidebar.updateHiddenCells();
        };
    }

    function patchPasteCellReplace() {
        /* ensure pasted cells have a unique janus id and sidebar updates */

        var oldPasteCellReplace = Jupyter.notebook.__proto__.paste_cell_replace;
        Jupyter.notebook.__proto__.paste_cell_replace = function() {
            //ensure newly created cells have a unique janus id
            for (var i = 0; i < Jupyter.notebook.clipboard.length; i++) {
                Jupyter.notebook.clipboard[i].metadata.janus.id = Math.random()
                    .toString(16)
                    .substring(2);
            }
            oldPasteCellReplace.apply(this, arguments);
            Jupyter.sidebar.updateHiddenCells();
        };
    }

    function patchEditMode() {
        /* handle going to edit mode when sidebar cell is selected */

        var oldEditMode = Jupyter.notebook.__proto__.edit_mode;
        Jupyter.notebook.__proto__.edit_mode = function() {
            var cell = Jupyter.notebook.get_selected_cell();
            if (cell.metadata.janus.cell_hidden) {
                cell.sb_cell.unrender();
                cell.sb_cell.focus_editor();
            } else {
                oldEditMode.apply(this, arguments);
            }
        };
    }

    function patchCommandMode() {
        /* handle going to command mode when sidebar cell is selected */

        var oldCommandMode = Jupyter.notebook.__proto__.command_mode;
        Jupyter.notebook.__proto__.command_mode = function() {
            var cell = Jupyter.notebook.get_selected_cell();
            if (cell.metadata.janus.cell_hidden && cell.sb_cell != undefined) {
                cell.sb_cell.code_mirror.getInputField().blur();
            } else {
                oldCommandMode.apply(this, arguments);
            }
        };
    }

    function patchUpdateSoftSelection() {
        /* ensure sidebar cells can be multi-selected (e.g. soft selected) */

        var oldUpdateSoftSelection =
            Jupyter.notebook.__proto__.update_soft_selection;
        Jupyter.notebook.__proto__.update_soft_selection = function() {
            oldUpdateSoftSelection.apply(this, arguments);

            // update soft selection in sidebar
            var sections = Jupyter.sidebar.sections;
            for (var i = 0; i < sections.length; i++) {
                var secCells = sections[i].cells;
                for (var j = 0; j < secCells.length; j++) {
                    if (secCells[j].nb_cell) {
                        if (
                            $(secCells[j].nb_cell.element).hasClass("jupyter-soft-selected")
                        ) {
                            secCells[j].element.addClass("jupyter-soft-selected");
                        } else {
                            secCells[j].element.removeClass("jupyter-soft-selected");
                        }
                    }
                }
            }

            // update selection to include hidden markers
            $(".hide-container.soft").removeClass("soft");

            selCells = Jupyter.notebook.get_selected_cells();
            for (var j = 0; j < selCells.length; j++) {
                if (
                    selCells[j].metadata.janus.cell_hidden &&
                    $(selCells[j].element).hasClass("jupyter-soft-selected")
                ) {
                    $(selCells[j].element)
                        .nextAll(".hide-container")
                        .first()
                        .addClass("soft");
                }
            }
        };
    }

    // JANUS METADATA
    function generateDefaultCellMetadata(cell) {
        /* generate default Janus metadata for a cell

                Args:
                    cell: cell to generate metadata for
                */

        var defaultCellMetadata = {
            id: Math.random().toString(16).substring(2),
            cell_hidden: false,
            source_hidden: false,
            output_hidden: false,
            show_versions: false,
            all_versions_showing: false,
            versions: [],
            named_versions: [],
            current_version: 0,
        };

        if (cell.metadata.janus === undefined) {
            cell.metadata.janus = defaultCellMetadata;
        } else {
            for (var key in defaultCellMetadata) {
                if (!cell.metadata.janus.hasOwnProperty(key)) {
                    cell.metadata.janus[key] = defaultCellMetadata[key];
                }
            }
        }

        if (cell.metadata.janus.cell_hidden) {
            cell.metadata.janus.source_hidden = true;
            cell.metadata.janus.output_hidden = true;
        }
    }

    function generateDefaultNBMetadata() {
        /* generate default Janus metadata for the notebook */

        var defaultNBMeta = {
            track_history: false,
            filepaths: [],
            // 'unexecutedCells': []
        };

        if (Jupyter.notebook.metadata.janus === undefined) {
            Jupyter.notebook.metadata.janus = defaultNBMeta;
        } else {
            for (var key in defaultNBMeta) {
                if (!Jupyter.notebook.metadata.janus.hasOwnProperty(key)) {
                    Jupyter.notebook.metadata.janus[key] = defaultNBMeta[key];
                }
            }
        }

        //update ui to reflect metadata
        if (!Jupyter.notebook.metadata.janus.track_history) {
            $("#toggle_nb_recording").find("a").text("Start Tracking Changes");
        }
    }

    function initializeJanusMetadata() {
        /* ensure the notebook and all cells have proper Janus metadata */

        generateDefaultNBMetadata();

        cells = Jupyter.notebook.get_cells();
        for (i = 0; i < cells.length; i++) {
            generateDefaultCellMetadata(cells[i]);
        }
    }

    function applyJanusPatches() {
        /* Patch all functions needed to run Janus extension */

        console.log("Monkey patching cell and notebook functions ...");

        // patch cell functions
        patchCellSelect();
        patchCellUnselect();
        patchToMarkdown();
        patchToCode();
        patchCodeExecute();
        patchTextRender();
        patchHandleExecuteReply();

        //patch notebook functions
        patchInsertCellAtIndex();
        patchMoveSelectionUp();
        patchMoveSelectionDown();
        patchMergeCellAbove();
        patchMergeCellBelow();
        patchDeleteCells();
        patchSplitCell();
        patchPasteCellAbove();
        patchPasteCellBelow();
        patchPasteCellReplace();
        patchEditMode();
        patchCommandMode();
        patchUpdateSoftSelection();
        patchCutCopyPaste();
    }

    return {
        applyJanusPatches: applyJanusPatches,
        generateDefaultCellMetadata: generateDefaultCellMetadata,
        initializeJanusMetadata: initializeJanusMetadata,
    };
});