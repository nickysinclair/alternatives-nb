/*
 * Set of utility functions
 */

define(["jquery", "base/js/namespace"], function($, Jupyter) {
    function retrieveLastSelectedCell() {
        /*
         * Return Array of selected cells and pull out the last one
         *
         * Note: returning last cell should be unnecessary as only single cell
         * can be selected but implementation protects against returning array
         */

        // Custom implementation
        // var nbContainerID = $(Jupyter.notebook.container).prop("id");
        // var selectedCells = $(
        //     `#${nbContainerID} > [class~='cell'][class~='selected']`
        // ).get();

        // Prefer implementation already offered by Jupyter.notebook class
        var selectedCells = Jupyter.notebook.get_selected_cells();
        var lastSelectedCell = selectedCells[selectedCells.length - 1];
        return lastSelectedCell;
    }

    function log(obj) {
        /* Log to console with [Literate Analytics] tag */

        if (typeof(obj) === "object") {
            console.dir(`[Literate Analytics] ${obj}`);
        } else {
            console.log(`[Literate Analytics] ${obj}`);
        }
    }

    return {
        retrieveLastSelectedCell: retrieveLastSelectedCell,
        log: log,
    };
});