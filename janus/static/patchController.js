/*
 * "Monkey patching" notebook functions.
 */

define([
    "jquery",
    "base/js/namespace",
    "notebook/js/cell",
    "notebook/js/textcell",
], function($, Jupyter, Cell, TextCell) {
    /*
     * PATCHES FOR LOW-LEVEL, CORE CELL INFO FUNCTIONS
     * IN NOTEBOOK:
     */

    function patchNotebookGetCellElements() {
        /* get_cell_elements
         *
         * No changes needed: `container.find(...).not(...) already traverses
         * entire tree, not just children
         */

        return null;
    }

    function patchNotebookGetCellElement() {
        /* get_cell_element
         *
         * No changes needed: get_cell_elements does getting heavy lifting
         * and get_cell_element unaffected by nested cells because get_cell_elements
         * returns as flat array
         */

        return null;
    }

    function patchNotebookGetCells() {
        /* get_cells
         *
         * No changes needed: get_cell_elements does getting heavy lifting
         * and get_cells unaffected by nested cells because get_cell_elements
         * returns as flat array
         */

        return null;
    }

    function patchNotebookFindCellIndex() {
        /* find_cell_index
         *
         * No changes needed: get_cell_elements does getting heavy lifting
         * and find_cell_index unaffected by nested cells because get_cell_elements
         * returns as flat array
         */

        return null;
    }

    function patchNotebookGetSelectedIndex() {
        /* get_selected_index
         *
         * No changes needed: get_cell_elements does getting heavy lifting
         * and get_selected_index unaffected by nested cells because get_cell_elements
         * returns as flat array
         */

        return null;
    }

    function patchNotebookNCells() {
        /* ncells
         *
         * No changes needed: get_cell_elements does getting heavy lifting
         * and ncells unaffected by nested cells because get_cell_elements
         * returns as flat array
         */

        return null;
    }

    function patchNotebookExtendSelectionBy() {
        /* extend_selection_by
         *
         * Simple helper function which executes a `select` based on the current
         * selection and a `delta` argument
         *
         * Make sure that this can execute `select` into/out of/including cells
         * within alternatives
         */
    }

    /*
     * PATCHES FOR CELL SELECTION FROM NOTEBOOK:
     */


    function patchNotebookContractSelection() {
        /* _contract_selection */

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
        /* select */

        // Below function is copy-paste of select function:
        // https://github.com/jupyter/notebook/blob/41f148395c2b056998768423257d9c8edb4244ec/notebook/static/notebook/js/notebook.js#L845
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

        // MONKEY PATCHING part
        Jupyter.notebook.__proto__.select = function(index, moveanchor, override = false) {

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
            } else {
                select.apply(this, [index, moveanchor]);
            }
        }
    }

    /*
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

    function patchNotebookDeleteCells() {
        /* delete_cells
         * 
         */

        // Approach to delete cells:
        //  1. Check our selection to see if we are selecting locked cells and unlock them
        //  2. Execute the standard delete cells functionality with function.apply(this, arguments)
        //  3. In reaction to the deleted selection, delete alternative set and alternatives containers and update the alternatives metadata
    }

    function patchNotebookInsertElementAtIndex() {
        /* _insert_element_at_index
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
            /*
             * START MONKEY PATCHING SECTION
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
            /* END MONKEY PATCHING SECTION */
            else if (this.is_valid_cell_index(index)) {
                // otherwise always somewhere to append to
                this.get_cell_element(index).before(element);
            } else {
                return false;
            }

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
        /*  */

        // TODO : Add condition where if at end of notebook and in alternative,
        // selecting next will create a cell outside the alternative

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
        /*  */

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

    /*
     * PATCHES FOR NOTEBOOK JSON SAVE/LOAD:
     */

    function patchNotebookFromJSON() {
        /* fromJSON
         *
         * fromJSON will load the `lit` metadata but needs to be patched to
         * lay out cells into alternatives and alternative sets
         *
         * A good strategy to do this might be to call fromJSON, then re-lay
         * out cells that go into alternatives
         */
    }

    /*
     * PATCHES FOR NOTEBOOK DEFAULTS:
     *  - Set first cell for new notebook to markdown
     *  - Set default notebook cell to markdown instead of code
     */

    function patchNotebookOptionsDefault() {
        /* Changes default cell type to markdown */

        Jupyter.notebook.class_config.defaults.default_cell_type = "markdown";
    }

    function patchNotebookFirstCellMarkdown() {
        /* Change default first cell to be markdown cell for new notebooks */

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

    function patchNotebookKeyboardShortcuts() {
        /* Set keyboard shortcuts for Literate Analytics actions */

        kb = Jupyter.keyboard_manager;

        kb.command_shortcuts.add_shortcut(
            "Shift-B",
            "literate-analytics:add-alternatives"
        );
        kb.command_shortcuts.add_shortcut(
            "Shift-D, d",
            "literate-analytics:delete-alternatives"
        );

        kb.command_shortcuts.add_shortcut(
            "Shift-1",
            "literate-analytics:set-alternatives-status-choice"
        );
        kb.command_shortcuts.add_shortcut(
            "Shift-2",
            "literate-analytics:set-alternatives-status-option"
        );
        kb.command_shortcuts.add_shortcut(
            "Shift-3",
            "literate-analytics:set-alternatives-status-archived"
        );

        kb.command_shortcuts.add_shortcut(
            "Shift-L",
            "literate-analytics:label-alternatives"
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
        console.log(Jupyter.notebook.selectNextFlag);
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
        /*
         * Notebook level patches applied to Notebook class living at:
         * git:jupyter/notebook/notebook/static/notebook/js/notebook.js
         */
        patchNotebookOptionsDefault();
        //patchNotebookFirstCellMarkdown();
        patchNotebookKeyboardShortcuts();
        patchNotebookInsertElementAtIndex();
        patchNotebookSelectNext();
        patchNotebookSelectPrev();
        // Patches not live because of edit mode issues on title cells
        //patchNotebookSelect();
        //patchNotebookContractSelection();


    }

    function patchActions() {
        patchActionsSelectNextCell();
    }

    return {
        patchNotebook: patchNotebook,
        patchActions: patchActions
    };
});