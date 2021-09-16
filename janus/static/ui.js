/*
Janus: Jupyter Notebook extension that helps users keep clean notebooks by
hiding cells and tracking changes
*/

define([
    "jquery",
    "base/js/namespace",
    "../janus/hide",
    "../janus/comment",
], function($, Jupyter, JanusHide, JanusComment) {
    function addItemToMenu(menu, id, text, click) {
        /* add <li> to menu

                    args:
                        menu: menu item to append <li> to
                        id: css id
                        text: text to put on menuitem
                        click: action to take on item click
                    */

        menu.append(
            $("<li>")
            .attr("id", id)
            .append($("<a>").attr("href", "#").text(text).click(click))
        );
    }

    function renderJanusMenu() {
        /* add Janus menu to main menubar */

        var navbar = $("#menubar .nav").first();

        navbar.append(
            $("<li>")
            .addClass("dropdown")
            .attr("id", "janus-header")
            .append(
                $("<a>")
                .addClass("dropdown-toggle")
                .attr("href", "#")
                .attr("data-toggle", "dropdown")
                .text("Janus")
            )
        );

        var janusHeader = $("#janus-header");

        janusHeader.append(
            $("<ul>").addClass("dropdown-menu").attr("id", "janus-menu")
        );

        var janusMenu = $("#janus-menu");

        addItemToMenu(
            janusMenu,
            "toggle_cell",
            "Toggle Cell",
            JanusHide.toggleSelCellsVisibility
        );
        addItemToMenu(
            janusMenu,
            "toggle_cell_input",
            "Toggle Cell Input",
            JanusHide.toggleSourceVisibility
        );
        addItemToMenu(
            janusMenu,
            "toggle_cell_output",
            "Toggle Cell Output",
            JanusHide.toggleOutputVisibility
        );

        janusMenu.append($("<li>").addClass("divider"));

        addItemToMenu(
            janusMenu,
            "hide_hidden_cells",
            "Toggle Sidebar",
            JanusHide.toggleAllSections
        );
    }

    function renderJanusButtons() {
        /* add Janus buttons to toolbar for easy access */

        var toggleCellAction = {
            icon: "fa-eye-slash",
            help: "Toggle Cell",
            help_index: "zz",
            handler: JanusHide.toggleSelCellsVisibility,
        };

        var toggleSourceAction = {
            icon: "fa-code",
            help: "Toggle Input",
            help_index: "zz",
            handler: JanusHide.toggleSourceVisibility,
        };

        var toggleOutputAction = {
            icon: "fa-area-chart",
            help: "Toggle Output",
            help_index: "zz",
            handler: JanusHide.toggleOutputVisibility,
        };

        var toggleSidebarAction = {
            icon: "fa-columns",
            help: "Toggle Sidebar",
            help_index: "zz",
            handler: JanusHide.toggleAllSections,
        };

        // generate full action names and link to action
        var prefix = "janus";
        var actionHandler = Jupyter.actions;

        var toggleCellName = actionHandler.register(
            toggleCellAction,
            "toggle-cell",
            prefix
        );
        var toggleSourceName = actionHandler.register(
            toggleSourceAction,
            "toggle-cell-input",
            prefix
        );
        var toggleOutputName = actionHandler.register(
            toggleOutputAction,
            "toggle-cell-output",
            prefix
        );
        var toggleSidebarName = actionHandler.register(
            toggleSidebarAction,
            "show-all-hidden",
            prefix
        );

        // add button groups to the main toolbar
        Jupyter.toolbar.add_buttons_group([
            toggleCellName,
            toggleSourceName,
            toggleOutputName,
        ]);

        Jupyter.toolbar.add_buttons_group([toggleSidebarName]);
    }

    function renderJanusUI() {
        /* Render both menu items and toolbar buttons */

        renderJanusMenu();
        renderJanusButtons();
    }

    return {
        renderJanusUI: renderJanusUI,
    };
});