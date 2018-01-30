/*
Janus: Jupyter Notebook extension that helps users keep clean notebooks by
folding cells and keeping track of all changes

Handle indenting and unindenting of cells to and from the Janus sidebar
*/

define([
    'jquery',
    'base/js/namespace',
    '../janus/utils'
], function(
    $,
    Jupyter,
    JanusUtils
){

// INDENT AND UNINDENT

    function toggleSelCellsVisibility() {
        /* toggle visiblity of all selected cells

        use the visibility of the primary selected cell to set visibility for
        remainder of selection */

        var selCell = Jupyter.notebook.get_selected_cell();
        var primaryHidden = selCell.metadata.janus.cell_hidden
        var selCells = Jupyter.notebook.get_selected_cells();

        for (var i = 0; i < selCells.length; i++) {
            if (primaryHidden) {
                showCell(selCells[i]);
            } else {
                hideCell(selCells[i]);
            }
        }

        // update placeholder markers and the sidebar
        Jupyter.sidebar.saveMarkerMetadata();
        Jupyter.sidebar.hideIndentedCells();
        Jupyter.sidebar.update();
    }


    function hideCell(cell) {
        /* hide a cell so it appears in the sidebar

        Args:
            cell: cell to hide
        */

        // styling
        cell.element.find("div.input").hide('slow');
        cell.element.find("div.output").hide('slow');
        cell.element.addClass('hidden');

        // metadata
        cell.metadata.janus.cell_hidden = true;
        cell.metadata.janus.source_hidden = true;
        cell.metadata.janus.output_hidden = true;

        // markers and sidebar
        Jupyter.sidebar.saveMarkerMetadata();
        Jupyter.sidebar.hideIndentedCells();
        Jupyter.sidebar.update();
    }


    function showCell(cell) {
        /* show a cell so it appears in the main notebook rather than sidebar

        Args:
            cell: cell to show
        */

        // TODO may need to update entire cell content, not just text

        // styling
        cell.element.find("div.input").show('slow');
        cell.element.find("div.output").show('slow');
        cell.element.removeClass('hidden');

        // update text with content from sidebar cell
        if (cell.sb_cell){
            cell.set_text(cell.sb_cell.get_text());
        }
        cell.render();

        // metadata
        cell.metadata.janus.cell_hidden = false;
        cell.metadata.janus.source_hidden = false;
        cell.metadata.janus.output_hidden = false;

        // update markers and sidebar
        renderSourceMarker(cell);
        renderOutputMarker(cell);
        Jupyter.sidebar.hideIndentedCells();
        Jupyter.sidebar.update();
    }


// HIDE SOURCE
    function toggleSourceVisibility() {
        /* Hide/Show the source of individual cells */

        var selCell = Jupyter.notebook.get_selected_cell();
        var showSource = selCell.metadata.janus.source_hidden
        var selCells = Jupyter.notebook.get_selected_cells();

        for (var i = 0; i < selCells.length; i++) {
            var numOutputs = selCells[i].output_area.outputs.length

            // if we should show the source
            if (showSource) {
                if (selCells[i].metadata.janus.output_hidden && numOutputs > 0) {
                    // only show the source
                    selCells[i].element.removeClass('hidden');
                    selCells[i].metadata.janus.source_hidden = false;
                    selCells[i].metadata.janus.cell_hidden = false;
                    selCells[i].element.find("div.input").show('slow');
                } else {
                    // show the whole cell
                    showCell(selCells[i])
                    selCells[i].element.find("div.input").show('slow');
                }
            } else {
                if (selCells[i].metadata.janus.output_hidden || numOutputs == 0) {
                    // hide the entire cell
                    hideCell(selCells[i])
                    selCells[i].element.find("div.input").hide('slow');
                } else {
                    // only hide the source
                    selCells[i].metadata.janus.source_hidden = true;
                    selCells[i].element.find("div.input").hide('slow');
                }
            }

            renderSourceMarker(selCells[i]);

        }

        Jupyter.sidebar.saveMarkerMetadata();
        Jupyter.sidebar.hideIndentedCells();
        Jupyter.sidebar.update();
    }


    function renderSourceMarker(cell) {
        /* Show marker on cell with hidden source

        Args:
            cell: main notebook cell to hide source
        */

        var outputArea = cell.element.find('div.output_wrapper')[0];
        var classes = "marker hidden-code fa fa-code";

        if (cell.metadata.janus.source_hidden) {
            JanusUtils.removeMarkerType('.hidden-code', outputArea);
            var marker = JanusUtils.addMarkerToElement(outputArea, classes);
            marker.onclick = function() { showCellInSidebar(cell, marker); };
        }
        else if (cell.cell_type == 'code') {
            JanusUtils.removeMarkerType('.hidden-code', outputArea);
            Jupyter.sidebar.collapse();
            // TODO may want to do Jupyter.sidebar.update() instead
        }
    }


// HIDE OUTPUTS
    function toggleOutputVisibility() {
        /* Hide/Show the outputs of individual cells */

        var selCell = Jupyter.notebook.get_selected_cell();
        var showOutput = selCell.metadata.janus.output_hidden;
        var selCells = Jupyter.notebook.get_selected_cells();

        for (var i = 0; i < selCells.length; i++) {

            var numOutputs = selCells[i].output_area.outputs.length
            if (numOutputs > 0){
                if (showOutput) {
                    if (! selCells[i].metadata.janus.source_hidden) {
                        showCell(selCells[i])
                        selCells[i].element.find("div.output").show('slow');
                    } else {
                        // just show the output
                        selCells[i].element.removeClass('hidden');
                        selCells[i].metadata.janus.output_hidden = false;
                        selCells[i].metadata.janus.cell_hidden = false;
                        selCells[i].element.find("div.output").show('slow');
                    }
                } else {
                    if (selCells[i].metadata.janus.source_hidden) {
                        selCells[i].metadata.janus.output_hidden = true;
                        selCells[i].metadata.janus.cell_hidden = true;
                        selCells[i].element.find("div.output").hide('slow');
                        hideCell(selCells[i])
                    } else if (numOutputs > 0) {
                        // hide just the output
                        selCells[i].metadata.janus.output_hidden = true;
                        selCells[i].element.find("div.output").hide('slow');
                    }
                }

            renderOutputMarker(selCells[i]);

            }
        }

        Jupyter.sidebar.saveMarkerMetadata();
        Jupyter.sidebar.hideIndentedCells();
        Jupyter.sidebar.update();
    }


    function renderOutputMarker(cell) {
        /* Show marker on cell with hidden source

        Args:
            Cell: cell to place marker on
        */

        var markerContainer = JanusUtils.getMarkerContainer(cell)
        var classes = "marker hidden-output fa fa-area-chart";

        if (cell.metadata.janus.output_hidden) {
            JanusUtils.removeMarkerType('.hidden-output', markerContainer);
            var marker = JanusUtils.addMarkerToElement(markerContainer, classes);
            marker.onclick = function() { showCellInSidebar(cell, marker); };
        }
        else if (cell.cell_type == 'code') {
            JanusUtils.removeMarkerType('.hidden-output', markerContainer);
            Jupyter.sidebar.collapse();
            // TODO may want to do Jupyter.sidebar.update() instead
        }
    }


// GENERAL
    function initializeVisibility() {
        /* hide source and outputs of all cells in nb with proper metadata */

        var cells = Jupyter.notebook.get_cells()
        for ( i=0; i < cells.length; i++ ) {

            // output hidden
            if (cells[i].metadata.janus.output_hidden) {
                renderOutputMarker(cells[i]);
                cells[i].element.find("div.output").hide('slow');
            }

            // source hidden
            if (cells[i].metadata.janus.source_hidden) {
                renderSourceMarker(cells[i]);
                cells[i].element.find("div.input").hide('slow');
            }
        }
    }


    function showCellInSidebar(cell, marker) {
        /* Show this cell in the sidebar

        Args:
            cell: cell to show
            marker: marker being clicked to show cell (use for sidebar position)
        */

        Jupyter.sidebar.marker = marker
        Jupyter.sidebar.markerPosition = $(cell.element).position().top
        Jupyter.sidebar.toggle([cell])
    }


    return {
        toggleSelCellsVisibility: toggleSelCellsVisibility,
        toggleSourceVisibility: toggleSourceVisibility,
        toggleOutputVisibility: toggleOutputVisibility,
        initializeVisibility, initializeVisibility
    };

});
