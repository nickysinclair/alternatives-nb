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

    function patchNotebookUpdateSoftSelection() {
        /* update_soft_selection
         *
         * Executed by `select` for multiple selections, this helper adds and
         * removes classes for cell highlighting in the "soft selection"
         *
         * Consider how alternative sets and alternatives could have changing
         * CSS when their cells are highlighted
         */
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
                // special case append it the end, but not empty
                this.get_cell_element(index - 1).after(element);
            }
            /*
             * START MONKEY PATCHING SECTION
             *
             * Change the index where things are applied depending on the 
             * context of selected cell
             */
            else if (this.get_cell_element(selectedIndex + 1).parent().hasClass("alternative-set-and-title-container")) {
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
            "Shift-A",
            "literate-analytics:add-alternatives"
        );
        kb.command_shortcuts.add_shortcut(
            "Shift-X",
            "literate-analytics:archive-alternatives"
        );
        kb.command_shortcuts.add_shortcut(
            "Shift-D, d",
            "literate-analytics:delete-alternatives"
        );
        kb.command_shortcuts.add_shortcut(
            "Shift-S",
            "literate-analytics:set-alternatives-status"
        );
        kb.command_shortcuts.add_shortcut(
            "Shift-L",
            "literate-analytics:label-alternatives"
        );
    }

    function patchNotebook() {
        /*
         * Notebook level patches applied to Notebook class living at:
         * git:jupyter/notebook/notebook/static/notebook/js/notebook.js
         */
        patchNotebookOptionsDefault();
        patchNotebookFirstCellMarkdown();
        patchNotebookKeyboardShortcuts();
        patchNotebookInsertElementAtIndex();
        patchNotebookSelectNext();
        patchNotebookSelectPrev();


    }

    return {
        patchNotebook: patchNotebook
    };
});