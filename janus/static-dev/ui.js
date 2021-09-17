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
        /*
         * add <li> to menu
         * args:
         *  - menu: menu item to append <li> to
         *  - id: css id
         *  - text: text to put on menuitem
         *  - click: action to take on item click
         */

        menu.append(
            $("<li>")
            .attr("id", id)
            .append($("<a>").attr("href", "#").text(text).click(click))
        );
    }

    var items = [
        [{
                name: "toggle_cell",
                display_name: "Toggle Cell",
                action: JanusHide.toggleSelCellsVisibility,
                icon: "fa-eye-slash",
            },
            {
                name: "toggle_cell_input",
                display_name: "Toggle Cell Input",
                action: JanusHide.toggleSourceVisibility,
                icon: "fa-code",
            },
            {
                name: "toggle_cell_output",
                display_name: "Toggle Cell Output",
                action: JanusHide.toggleOutputVisibility,
                icon: "fa-area-chart",
            },
        ],
        [{
            name: "hide_hidden_cells",
            display_name: "Toggle Sidebar",
            action: JanusHide.toggleAllSections,
            icon: "fa-columns",
        }, ],
    ];

    function addItems(items) {
        /*
         * Function adding items to menu and toolbar according to data
         * structure defined in `var items`
         */

        // Create the navigation bar
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

        // Add a janus header and add menu to it
        var janusHeader = $("#janus-header");
        janusHeader.append(
            $("<ul>").addClass("dropdown-menu").attr("id", "janus-menu")
        );

        // Loop array of arrays and extract action information from dictionary
        // to render menu and buttons
        var janusMenu = $("#janus-menu");
        var prefix = "janus";
        var actionHandler = Jupyter.actions;
        for (let i = 0; i < items.length; i++) {
            var handledActions = [];
            for (let j = 0; j < items[i].length; j++) {
                // Add to menu
                addItemToMenu(
                    janusMenu,
                    items[i][j].name,
                    items[i][j].display_name,
                    items[i][j].action
                );

                // Toolbar work
                var action = {
                    icon: items[i][j].icon,
                    help: items[i][j].display_name,
                    help_index: "zz",
                    handler: items[i][j].action,
                };

                var handledAction = actionHandler.register(
                    action,
                    items[i][j].name.replace("_", "-"),
                    prefix
                );

                handledActions.push(handledAction);
            }

            // If next group exists, add a line divider
            if (items[i + 1]) {
                janusMenu.append($("<li>").addClass("divider"));
            }

            // Add group to toolbar
            Jupyter.toolbar.add_buttons_group(handledActions);
        }
    }

    // Duplicated code below condensed into above `var items` and `function addItems()`
    // function renderJanusMenu() {
    //     /* add Janus menu to main menubar */

    //     var navbar = $("#menubar .nav").first();

    //     navbar.append(
    //         $("<li>")
    //         .addClass("dropdown")
    //         .attr("id", "janus-header")
    //         .append(
    //             $("<a>")
    //             .addClass("dropdown-toggle")
    //             .attr("href", "#")
    //             .attr("data-toggle", "dropdown")
    //             .text("Janus")
    //         )
    //     );

    //     var janusHeader = $("#janus-header");

    //     janusHeader.append(
    //         $("<ul>").addClass("dropdown-menu").attr("id", "janus-menu")
    //     );

    //     var janusMenu = $("#janus-menu");

    //     addItemToMenu(
    //         janusMenu,
    //         "toggle_cell",
    //         "Toggle Cell",
    //         JanusHide.toggleSelCellsVisibility
    //     );
    //     addItemToMenu(
    //         janusMenu,
    //         "toggle_cell_input",
    //         "Toggle Cell Input",
    //         JanusHide.toggleSourceVisibility
    //     );
    //     addItemToMenu(
    //         janusMenu,
    //         "toggle_cell_output",
    //         "Toggle Cell Output",
    //         JanusHide.toggleOutputVisibility
    //     );

    //     janusMenu.append($("<li>").addClass("divider"));

    //     addItemToMenu(
    //         janusMenu,
    //         "hide_hidden_cells",
    //         "Toggle Sidebar",
    //         JanusHide.toggleAllSections
    //     );
    // }

    // function renderJanusButtons() {
    //     /* add Janus buttons to toolbar for easy access */

    //     var toggleCellAction = {
    //         icon: "fa-eye-slash",
    //         help: "Toggle Cell",
    //         help_index: "zz",
    //         handler: JanusHide.toggleSelCellsVisibility,
    //     };

    //     var toggleSourceAction = {
    //         icon: "fa-code",
    //         help: "Toggle Input",
    //         help_index: "zz",
    //         handler: JanusHide.toggleSourceVisibility,
    //     };

    //     var toggleOutputAction = {
    //         icon: "fa-area-chart",
    //         help: "Toggle Output",
    //         help_index: "zz",
    //         handler: JanusHide.toggleOutputVisibility,
    //     };

    //     var toggleSidebarAction = {
    //         icon: "fa-columns",
    //         help: "Toggle Sidebar",
    //         help_index: "zz",
    //         handler: JanusHide.toggleAllSections,
    //     };

    //     // generate full action names and link to action
    //     var prefix = "janus";
    //     var actionHandler = Jupyter.actions;

    //     var toggleCellName = actionHandler.register(
    //         toggleCellAction,
    //         "toggle-cell",
    //         prefix
    //     );
    //     var toggleSourceName = actionHandler.register(
    //         toggleSourceAction,
    //         "toggle-cell-input",
    //         prefix
    //     );
    //     var toggleOutputName = actionHandler.register(
    //         toggleOutputAction,
    //         "toggle-cell-output",
    //         prefix
    //     );
    //     var toggleSidebarName = actionHandler.register(
    //         toggleSidebarAction,
    //         "show-all-hidden",
    //         prefix
    //     );

    //     // add button groups to the main toolbar
    //     Jupyter.toolbar.add_buttons_group([
    //         toggleCellName,
    //         toggleSourceName,
    //         toggleOutputName,
    //     ]);

    //     Jupyter.toolbar.add_buttons_group([toggleSidebarName]);
    // }

    function renderJanusUI() {
        /* Render both menu items and toolbar buttons */

        // renderJanusMenu();
        // renderJanusButtons();
        addItems(items);
    }

    return {
        renderJanusUI: renderJanusUI,
    };
});