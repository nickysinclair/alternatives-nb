/*
 * Set of utility functions
 */

define(["jquery", "base/js/namespace"], function($, Jupyter) {
    function retrieveSelectedCell() {
        /*
         * Return Array of selected cells and pull out the last one
         *
         * Note: returning last cell should be unnecessary as only single cell
         * can be selected but implementation protects against returning array
         */

        var nbContainerID = $(Jupyter.notebook.container).prop("id");
        var selectedCells = $(
            `#${nbContainerID} > [class~='cell'][class~='selected']`
        ).get();
        var lastSelectedCell = selectedCells[selectedCells.length - 1];
        return lastSelectedCell;
    }

    return {
        retrieveSelectedCell: retrieveSelectedCell,
    };
});