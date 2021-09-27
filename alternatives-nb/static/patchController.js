/**
 * "Monkey patching" notebook functions.
 */

define([
    "jquery",
    "base/js/namespace",
    "notebook/js/cell",
    "notebook/js/textcell",
], function($, Jupyter, Cell, TextCell) {

    /**
     * PATCHES FOR CELL SELECTION FROM NOTEBOOK:
     */


    function patchNotebookContractSelection() {
        /** _contract_selection
         * 
         * 
         */

        Jupyter.notebook.__proto__._contract_selection = function() {
            var i = Jupyter.notebook.get_selected_index();
            var el = Jupyter.notebook.get_cell_element(i);
            console.log(el);
            if (el.parent().hasClass("alternative-container") && el.prev().length === 0) {
                // if selecting alternative title cell, override for normal selection
                console.log("override");
                Jupyter.notebook.select(i, true, true);
            } else {
                console.log("NOT override");
                Jupyter.notebook.select(i, true, false);
            }
        }
    }

    function patchNotebookSelect() {
        /** select 
         * 
         * Monkey patching select to select entire alternative sets
         * and alternatives on title cell selection
         * 
         * Current implementation is not actually patched because
         * of buggy cell editing behavior which affects cursor location
         * in cell clicking
         * 
         * Permalink: https://github.com/jupyter/notebook/blob/41f148395c2b056998768423257d9c8edb4244ec/notebook/static/notebook/js/notebook.js#L845
         */

        /**
         * Original function copy-pasted
         */
        select = function(index, moveanchor) {
            moveanchor = (moveanchor === undefined) ? true : moveanchor;

            if (this.is_valid_cell_index(index)) {
                var sindex = this.get_selected_index();
                if (sindex !== null && index !== sindex) {
                    // If we are about to select a different cell, make sure we are
                    // first in command mode.
                    if (this.mode !== 'command') {
                        this.command_mode();
                    }
                    this.get_cell(sindex).unselect(moveanchor);
                }
                if (moveanchor) {
                    this.get_cell(this.get_anchor_index()).unselect(moveanchor);
                }
                var cell = this.get_cell(index);
                cell.select(moveanchor);
                this.update_soft_selection();
                if (cell.cell_type === 'heading') {
                    this.events.trigger('selected_cell_type_changed.Notebook', {
                        'cell_type': cell.cell_type,
                        'level': cell.level,
                        'editable': cell.is_editable()
                    });
                } else {
                    this.events.trigger('selected_cell_type_changed.Notebook', {
                        'cell_type': cell.cell_type,
                        'editable': cell.is_editable()
                    });
                }
            }
            return this;
        };

        Jupyter.notebook.__proto__.select = function(index, moveanchor, override = false) {

            /**
             * START MONKEY PATCHING
             */
            var el = Jupyter.notebook.get_cell_element(index);
            if (override) {
                select.apply(this, [index, moveanchor]);
            } else if (el.parent().hasClass("alternative-set-and-title-container") && !override) {
                // if index shows us we're at alternative set title cell
                var lastAlternativesCell = el.parent().find(".cell").last().data().cell;
                var lastAlternativesCellIndex = Jupyter.notebook.find_cell_index(lastAlternativesCell);
                select.apply(this, [lastAlternativesCellIndex, true]);
                select.apply(this, [index, false]);
            } else if (el.parent().hasClass("alternative-container") && el.prev().length === 0 && !override) {
                if (false) {
                    // TODO : Support selecting multiple alternatives via shift + click and shift + up/down
                    // See jupyter/notebook: notebook/static/notebook/js/cells.js - Cell.prototype._on_click
                    // which triggers 'select.Cell' event which is listened to at
                    // notebook/static/notebook/js/notebook.js - Notebook.prototype.bind_events - this.on('select.Cell', ...

                    // if alternative is already within selection, extend selection
                    // while maintaining current selection
                    // ...
                }
                // if index shows us we're at an alternative title cell
                var lastAlternativeCell = el.parent().find(".cell").last().data().cell;
                var lastAlternativeCellIndex = Jupyter.notebook.find_cell_index(lastAlternativeCell);
                select.apply(this, [lastAlternativeCellIndex, true]);
                select.apply(this, [index, false]);
            }
            /**
             * END MONKEY PATCHING
             */
            else {
                // Normal selection behavior
                select.apply(this, [index, moveanchor]);
            }
        }
    }

    /**
     * PATCHES FOR NOTEBOOK CELL MANIPULATION:
     *  - Move cell(s) up/down
     *  - Delete cell(s)
     *  - Insert cells above/below
     *  - Cut/copy/paste cell(s)
     *  - Split/merge cell(s)
     *
     * All of these above functions must be patched to record the metadata
     * necessary to tag cells' metadata with the alternative and alternative
     * set IDs for persisting via to/from JSON!
     */

    function patchCellMetadataOnPaste(new_cell) {
        /** 
         * MONKEY PATCHING applied to paste_cell_replace, paste_cell_above,
         * and paste_cell_below
         */

        var alternativeCell = $(new_cell.element).parent().hasClass("alternative-container") ? true : false;
        if (alternativeCell) {
            // if pasted into alternative container
            var alternativeID = $(new_cell.element).parent().data().alternative.id;
            newMetadata = {
                alternativeID: alternativeID,
            }
            for (var key in newMetadata) {
                new_cell.metadata[key] = newMetadata[key];
            }
        } else {
            // if pasted outside of alternative container

            // Cover all bases in terms of deleting metadata
            // `delete` on absent key fails silently by returning `true` - acceptable behavior
            // TODO : Do this dynamically
            delete new_cell.metadata.alternativeID;
            delete new_cell.metadata.alternativeTitle;
            delete new_cell.metadata.alternativeSetTitle;
            delete new_cell.metadata.alternativeSetID;
        }
    }

    function patchNotebookPasteCellReplace() {
        /** paste_cell_replace
         * 
         * Code is heavily adapted from original source with monkey patch to 
         * add/remove alternative ID metadata
         * 
         * Permalink: https://github.com/jupyter/notebook/blob/41f148395c2b056998768423257d9c8edb4244ec/notebook/static/notebook/js/notebook.js#L1669
         */

        Jupyter.notebook.__proto__.paste_cell_replace = function() {

            if (!(Jupyter.notebook.clipboard !== null && Jupyter.notebook.paste_enabled)) {
                return;
            }

            var selected = Jupyter.notebook.get_selected_cells_indices();
            var insertion_index = selected[0];
            Jupyter.notebook.delete_cells(selected);

            for (var i = Jupyter.notebook.clipboard.length - 1; i >= 0; i--) {
                var cell_data = Jupyter.notebook.clipboard[i];
                var new_cell = Jupyter.notebook.insert_cell_at_index(cell_data.cell_type, insertion_index);
                new_cell.fromJSON(cell_data);
                /**
                 * START MONKEY PATCHING
                 */
                patchCellMetadataOnPaste(new_cell);
                /**
                 * END MONKEY PATCHING
                 */
            }

            Jupyter.notebook.select(insertion_index + Jupyter.notebook.clipboard.length - 1);
        }
    }

    function patchNotebookPasteCellAbove() {
        /** paste_cell_above
         * 
         * Code is heavily adapted from original source with monkey patch to 
         * add/remove alternative ID metadata
         * 
         * Permalink: https://github.com/jupyter/notebook/blob/41f148395c2b056998768423257d9c8edb4244ec/notebook/static/notebook/js/notebook.js#L1691
         */

        Jupyter.notebook.__proto__.paste_cell_above = function() {

            if (Jupyter.notebook.clipboard !== null && Jupyter.notebook.paste_enabled) {
                var first_inserted = null;
                for (var i = 0; i < Jupyter.notebook.clipboard.length; i++) {
                    var cell_data = Jupyter.notebook.clipboard[i];
                    var new_cell = Jupyter.notebook.insert_cell_above(cell_data.cell_type);
                    new_cell.fromJSON(cell_data);
                    /**
                     * START MONKEY PATCHING
                     */
                    patchCellMetadataOnPaste(new_cell);
                    /**
                     * END MONKEY PATCHING
                     */
                    if (first_inserted === null) {
                        first_inserted = new_cell;
                    }
                }
                first_inserted.focus_cell();
            }
        }
    }

    function patchNotebookPasteCellBelow() {
        /** paste_cell_below
         * 
         * Code is heavily adapted from original source with monkey patch to 
         * add/remove alternative ID metadata
         * 
         * Permalink: https://github.com/jupyter/notebook/blob/41f148395c2b056998768423257d9c8edb4244ec/notebook/static/notebook/js/notebook.js#L1709
         */

        Jupyter.notebook.__proto__.paste_cell_below = function() {

            if (Jupyter.notebook.clipboard !== null && Jupyter.notebook.paste_enabled) {
                var first_inserted = null;
                for (var i = Jupyter.notebook.clipboard.length - 1; i >= 0; i--) {
                    var cell_data = Jupyter.notebook.clipboard[i];
                    var new_cell = Jupyter.notebook.insert_cell_below(cell_data.cell_type);
                    new_cell.fromJSON(cell_data);
                    /**
                     * START MONKEY PATCHING
                     */
                    patchCellMetadataOnPaste(new_cell);
                    /**
                     * END MONKEY PATCHING
                     */
                    if (first_inserted === null) {
                        first_inserted = new_cell;
                    }
                }
                first_inserted.focus_cell();
            }
        }
    }

    function patchNotebookInsertElementAtIndex() {
        /** _insert_element_at_index
         *
         * Re-writing this implementation to be mindful of alternative set and
         * alternative elements within the notebook container. Code heavily 
         * borrowed/adapted from original source perma-linked
         * 
         * Note that the additional logic helps place inserted cells within or
         * outside of elements to meet expected behavior but can only accommodate
         * behavior which does not change the overall approach to insertion at index
         * or above/below index
         * 
         * Permalink: https://github.com/jupyter/notebook/blob/41f148395c2b056998768423257d9c8edb4244ec/notebook/static/notebook/js/notebook.js#L1341
         */

        Jupyter.notebook.__proto__._insert_element_at_index = function(element, index) {
            if (element === undefined) {
                return false;
            }

            // Determine whether action is insert above or below
            var selectedIndex = this.get_selected_index()
            if (selectedIndex === index) {
                var insert = "above";
            } else if (selectedIndex + 1 === index) {
                var insert = "below";
            } else {
                return false;
            }

            var ncells = this.ncells();

            if (ncells === 0) {
                // special case append if empty
                this.container.append(element);
            } else if (ncells === index) {
                // Special MONKEY PATCHING for select next from last cell in alternative
                // Creates news cell outside of alternative
                if (Jupyter.notebook.selectNextFlag) {
                    // if last cell overall and selecting down, append to end of nb container
                    $("#notebook-container").append(element);
                } else {
                    // special case append it the end, but not empty
                    this.get_cell_element(index - 1).after(element);
                }
            }
            /**
             * START MONKEY PATCHING
             *
             * Change the index where things are applied depending on the 
             * context of selected cell
             */
            else if (ncells === index + 1 && insert === "above") {
                // if inserting above at last cell
                this.get_cell_element(index).before(element);
            } else if (this.get_cell_element(selectedIndex + 1).parent().hasClass("alternative-set-and-title-container")) {
                // at cell before alternative set title cell
                if (insert === "above") {
                    // if inserting above, insert before (normal behavior)
                    this.get_cell_element(selectedIndex).before(element);
                } else if (insert === "below") {
                    // if inserting below, insert after alternative set title and alternative #1 title
                    this.get_cell_element(selectedIndex).after(element)
                }
            } else if (this.get_cell_element(selectedIndex).parent().hasClass("alternative-set-and-title-container")) {
                // at alternative set title cell
                if (insert === "above") {
                    // if inserting above, insert after last cell before alternative set title cell
                    this.get_cell_element(selectedIndex - 1).after(element);
                } else if (insert === "below") {
                    // if inserting below, insert after alternative #1 title
                    this.get_cell_element(selectedIndex + 1).after(element);
                }
            } else if (this.get_cell_element(selectedIndex).closest(".alternative-container").length != 0) {
                // if selecting any cells within any alternatives
                if (this.get_cell_element(selectedIndex).prev().length === 0) {
                    // if cell is the first within an alternative
                    if (insert === "above") {
                        // if inserting above
                        if (this.get_cell_element(selectedIndex - 1).parent().hasClass("alternative-set-and-title-container")) {
                            // if the cell above is the alternative set title cell, insert after last
                            // cell before alternative set title cell
                            this.get_cell_element(selectedIndex - 2).after(element);
                        } else {
                            // otherwise insert after last cell of previous alternative
                            this.get_cell_element(selectedIndex - 1).after(element);
                        }
                    } else if (insert === "below") {
                        // if inserting below, insert after selected cell
                        this.get_cell_element(selectedIndex).after(element);

                    }
                } else if (this.get_cell_element(selectedIndex).next().length === 0) {
                    // if cell is the last within an alternative
                    if (insert === "above") {
                        this.get_cell_element(selectedIndex).before(element);
                    } else if (insert === "below") {
                        this.get_cell_element(selectedIndex).after(element);
                    }
                } else {
                    // otherwise for a cell not at the beginning or end act normal
                    if (insert === "above") {
                        this.get_cell_element(selectedIndex).before(element);
                    } else if (insert === "below") {
                        this.get_cell_element(selectedIndex).after(element);
                    }
                }
            }
            /** 
             * END MONKEY PATCHING
             */
            else if (this.is_valid_cell_index(index)) {
                // otherwise always somewhere to append to
                this.get_cell_element(index).before(element);
            } else {
                return false;
            }

            /**
             * START MONKEY PATCHING - METADATA
             */
            patchCellMetadataOnPaste(element.data().cell);
            /**
             * END MONKEY PATCHING - METADATA
             */

            this.undelete_backup_stack.map(function(undelete_backup) {
                if (index < undelete_backup.index) {
                    undelete_backup.index += 1;
                }
            });
            this.set_dirty(true);
            return true;
        }
    }


    function patchNotebookSelectNext() {
        /** select_next
         * 
         * Monkey patching to not select archived, hidden cells during
         * select navigation, e.g., using up arrow and down arrow keys
         * 
         * Permalink: https://github.com/jupyter/notebook/blob/41f148395c2b056998768423257d9c8edb4244ec/notebook/static/notebook/js/notebook.js#L891
         */

        // TODO : If user is using extend selection via shift+up/down or 
        // shift+click select_next and select_prev will include hidden cells
        // Accommodating this use case is seemingly complex

        Jupyter.notebook.__proto__.select_next = function(moveanchor) {
            var index = this.get_selected_index();
            var ncells = this.ncells();
            if (index + 1 === ncells) {
                // if at last cell, use original code
                this.select(index + 1, moveanchor);
                return this;
            }

            var numCellsAhead = ncells - (index + 1);
            for (let i = 0; i < numCellsAhead; i++) {
                var cellParentElement = this.get_cell_element(index + i + 1).parent();
                if (!cellParentElement.hasClass("archived")) {
                    // if the alternative container is archived
                    if (!cellParentElement.hasClass("hidden")) {
                        // and if the alternative container is hidden
                        this.select(index + i + 1, moveanchor);
                        return this;
                    }
                }
            }
        }
    }

    function patchNotebookSelectPrev() {
        /** select_prev
         * 
         * See `patchNotebookSelectNext` for highly similar implementation
         * with implementation "looking behind" here instead of "looking ahead"
         * 
         * Permalink: https://github.com/jupyter/notebook/blob/41f148395c2b056998768423257d9c8edb4244ec/notebook/static/notebook/js/notebook.js#L902
         */

        Jupyter.notebook.__proto__.select_prev = function(moveanchor) {
            var index = this.get_selected_index();
            var ncells = this.ncells();
            if (index === 0) {
                // if at first cell, use original code
                this.select(index - 1, moveanchor);
                return this;
            }

            var numCellsBehind = index;
            for (let i = 0; i < numCellsBehind; i++) {
                var cellParentElement = this.get_cell_element(index - i - 1).parent();
                if (!cellParentElement.hasClass("archived")) {
                    // if the alternative container is archived
                    if (!cellParentElement.hasClass("hidden")) {
                        // and if the alternative container is hidden
                        this.select(index - i - 1, moveanchor);
                        return this;
                    }
                }
            }
        }
    }

    /**
     * PATCHES FOR NOTEBOOK DEFAULTS:
     *  - Set first cell for new notebook to markdown
     *  - Set default notebook cell to markdown instead of code
     */

    function patchNotebookOptionsDefault() {
        /** Changes default cell type to markdown */

        Jupyter.notebook.class_config.defaults.default_cell_type = "markdown";
        TextCell.MarkdownCell.options_default.placeholder = "Input analytical rationale in *Markdown* or convert to code cell";
    }

    function patchNotebookFirstCellMarkdown() {
        /** 
         * Change default first cell to be markdown cell for new notebooks
         * 
         * Implementation is not used because of buggy behavior with editing
         * the first cell and inserting new cells
         */

        // Hack to change first code cell in new notebook to markdown
        nb = Jupyter.notebook;
        if (nb.ncells() === 1 && nb.notebook_name.startsWith("Untitled")) {
            // TODO : Greet the user with an executed Markdown cell above the
            // empty title cell detailing purpose, actions (with KB shortcuts), etc.

            // Set to markdown
            nb.cells_to_markdown([0]);

            // Insert placeholder text
            var motivationCell = nb.get_cell(nb.get_selected_index());
            motivationCell.set_text(
                `# Title\n\n[Insert a motivation for the notebook content]`
            );

            // Set to normal notebook opening per Jupyter.notebook.load_notebook_success
            // https://github.com/jupyter/notebook/blob/41f148395c2b056998768423257d9c8edb4244ec/notebook/static/notebook/js/notebook.js#L3139
            nb.select(0);
            nb.handle_command_mode(nb.get_cell(0));
            nb.set_dirty(false);
            nb.scroll_to_top();
        }
    }

    function patchKeyboardShortcuts() {
        /** Set keyboard shortcuts for alternatives-nb actions */

        kb = Jupyter.keyboard_manager;

        kb.command_shortcuts.add_shortcut(
            "Shift-B",
            "alternatives-nb:add-alternatives"
        );
        kb.command_shortcuts.add_shortcut(
            "Shift-D",
            "alternatives-nb:delete-alternatives"
        );

        kb.command_shortcuts.add_shortcut(
            "Shift-1",
            "alternatives-nb:set-alternatives-status-choice"
        );
        kb.command_shortcuts.add_shortcut(
            "Shift-2",
            "alternatives-nb:set-alternatives-status-option"
        );
        kb.command_shortcuts.add_shortcut(
            "Shift-3",
            "alternatives-nb:set-alternatives-status-archived"
        );

        kb.command_shortcuts.add_shortcut(
            "Shift-L",
            "alternatives-nb:label-alternatives"
        );
    }

    function attachNotebookFlag() {
        Jupyter.notebook.__proto__.selectNextFlag = false;
    }

    function setNotebookFlag(flag) {
        Jupyter.notebook.__proto__.selectNextFlag = flag;
    }

    function patchActionsSelectNextCell() {

        attachNotebookFlag();
        //var selectNextCell = Jupyter.actions._actions["jupyter-notebook:select-next-cell"];
        var newHandler = function(env) {
            var index = env.notebook.get_selected_index();
            setNotebookFlag(false);
            if (index !== (env.notebook.ncells() - 1) && index !== null) {
                env.notebook.select_next(true);
                env.notebook.focus_cell();
            } else if (index === (env.notebook.ncells() - 1) && index != null) {
                if (env.notebook.get_cell(index).metadata.alternativeID) {
                    // if has an alternative ID, i.e., is in an alternative
                    setNotebookFlag(true);
                    env.notebook.insert_cell_at_index('markdown', index + 1);
                    env.notebook.select(index + 1);
                    env.notebook.set_dirty(true);
                }
            }
            setNotebookFlag(false);
        }
        Jupyter.actions._actions["jupyter-notebook:select-next-cell"].handler = newHandler;
    }

    function patchNotebook() {
        /**
         * Notebook level patches applied to Notebook class
         * 
         * Permalink: https://github.com/jupyter/notebook/blob/41f148395c2b056998768423257d9c8edb4244ec/notebook/static/notebook/js/notebook.js
         */
        patchNotebookOptionsDefault();
        //patchNotebookFirstCellMarkdown(); // TODO : resolve buggy behavior

        patchNotebookInsertElementAtIndex();
        patchNotebookSelectNext();
        patchNotebookSelectPrev();
        patchNotebookPasteCellReplace();
        patchNotebookPasteCellAbove();
        patchNotebookPasteCellBelow();

        // TODO : Revisit select and _contract_selection patches in detail for
        // determining solution path
        //patchNotebookSelect();
        //patchNotebookContractSelection();


    }

    function patchActions() {
        patchActionsSelectNextCell();
    }

    function patchKeyboard() {
        patchKeyboardShortcuts();
    }

    return {
        patchNotebook: patchNotebook,
        patchActions: patchActions,
        patchKeyboard: patchKeyboard
    };
});