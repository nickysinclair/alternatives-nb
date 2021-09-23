/*
 * "Monkey patching" notebook functions.
 */

define([
    "jquery",
    "base/js/namespace",
    "notebook/js/cell",
    "notebook/js/textcell"
], function(
    $,
    Jupyter,
    Cell,
    TextCell
) {

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

    function patchNotebookSelect() {
        /* select */
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
        if (Jupyter.notebook.ncells() === 1 &&
            Jupyter.notebook.notebook_name.startsWith("Untitled")) {

            // TODO: Greet the user with an executed Markdown cell above the
            // empty title cell detailing purpose, actions (with KB shortcuts), etc.

            // Set to markdown
            Jupyter.notebook.cells_to_markdown([0]);
            Jupyter.notebook.edit_mode();

            // Insert placeholder text
            var firstCell = Jupyter.notebook.get_cell(
                Jupyter.notebook.get_selected_index()
            );
            firstCell.set_text(
                `# Title\n\n[Insert a motivation for the notebook content]`
            );
            // Set cursor to edit the text title
            firstCell.code_mirror.setCursor({ line: 0, ch: 2 });


        };
    }

    function patchNotebookKeyboardShortcuts() {
        /* Set keyboard shortcuts for Literate Analytics actions */

        kb = Jupyter.keyboard_manager;

        kb.command_shortcuts.add_shortcut(
            "Shift-A", "literate-analytics:add-alternatives"
        );
        kb.command_shortcuts.add_shortcut(
            "Shift-X", "literate-analytics:archive-alternatives"
        );
        kb.command_shortcuts.add_shortcut(
            "Shift-D, d", "literate-analytics:delete-alternatives"
        );
        kb.command_shortcuts.add_shortcut(
            "Shift-S", "literate-analytics:set-alternatives-status"
        );
        kb.command_shortcuts.add_shortcut(
            "Shift-L", "literate-analytics:label-alternatives"
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
    }

    return {
        patchNotebook: patchNotebook,
    };
});