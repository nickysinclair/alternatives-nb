/****
 * Set of utility functions
 */

define(["jquery", "base/js/namespace"], function($, Jupyter) {
    function retrieveLastSelectedCell() {
        /**
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
        /** 
         * Log to console with [alternatives-nb] tag 
         */

        if (typeof obj === "object") {
            console.dir(`[alternatives-nb] ${obj}`);
        } else {
            console.log(`[alternatives-nb] ${obj}`);
        }
    }

    function capitalizeFirstLetter(string) {
        /**
         * Implementation citation:
         * https://stackoverflow.com/questions/1026069/how-do-i-make-the-first-letter-of-a-string-uppercase-in-javascript
         */
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function lowercaseFirstLetter(string) {
        /**
         * Implementation approach from {@link capitalizeFirstLetter}
         */
        return string.charAt(0).toLowerCase() + string.slice(1);
    }

    return {
        retrieveLastSelectedCell: retrieveLastSelectedCell,
        log: log,
        capitalizeFirstLetter: capitalizeFirstLetter,
        lowercaseFirstLetter: lowercaseFirstLetter,
    };
});