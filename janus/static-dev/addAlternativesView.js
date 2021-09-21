/*
 * Dialog for add alternatives
 */

define([
    "jquery",
    "base/js/namespace",
    "base/js/dialog",
    "base/js/utils",
], function($, Jupyter, dialog, utils) {
    function createAddAlternativesModal() {
        /* show the add alternatives modal */

        // HTML body container
        var modal_body = $("<div/>");

        // Add alternatives input
        var addAlternativesArea = $("<div/ id='add-alternatives-area'>");
        var prompt = "Number of alternatives:";
        var addAlternativesPrompt = $("<div/ id='add-alternatives-prompt'>").text(
            prompt
        );
        addAlternativesArea.append(addAlternativesPrompt);

        var addAlternativesBox = $("<input id='add-alternatives-box'>");
        addAlternativesBox.type = "number";
        addAlternativesBox.attr({
            min: 1,
            max: 10,
            placeholder: 1,
        });

        // Piece together into hierarchy
        addAlternativesArea.append(addAlternativesBox);
        modal_body.append(addAlternativesArea);

        // Create the modal
        var mod = dialog.modal({
            title: "Add Alternatives",
            body: modal_body,
            default_button: null,

            // Show next dialog on click and pass on value
            buttons: {
                Next: {
                    click: function() {
                        createSetAlternativesModal($("#add-alternatives-box").val());
                    },
                },
            },
            notebook: Jupyter.notebook,
            keyboard_manager: Jupyter.notebook.keyboard_manager,
        });

        // When the modal opens, populate it with something
        mod.on("shown.bs.modal", function() {
            // focus the comment bar after a slight delay
            setTimeout(function() {
                $("#add-alternatives-box").focus();
            }, 50);
        });
    }

    function createSetAlternativesModal(numAlternatives, kb, nb) {
        /* show the add alternatives modal */

        // HTML body container
        var modal_body = $("<div/>");

        // Set alternatives input
        var setAlternativesArea = $("<div/ id='set-alternatives-area'>");
        var prompt = "Set alternatives:";
        var setAlternativesPrompt = $("<div/ id='set-alternatives-prompt'>").text(
            prompt
        );
        setAlternativesArea.append(setAlternativesPrompt);

        // For each desired alternative lay out input fields
        for (let i = 0; i < numAlternatives; i++) {
            var rowContainer = $("<div class='set-alternatives-container'/>");

            var setAlternativesTitle = $("<input>");
            setAlternativesTitle.attr({
                id: `#set-alternatives-title-${i+1}`,
                class: `set-alternatives-title`,
                type: "text",
                value: `Untitled Alternative ${i+1}`
            });
            rowContainer.append(setAlternativesTitle);

            var setAlternativesStatus = $("<input>");
            setAlternativesStatus.attr({
                id: `#set-alternatives-status-${i+1}`,
                class: `set-alternatives-status`,
                type: "checkbox",
            });
            rowContainer.append(setAlternativesStatus);

            setAlternativesArea.append(rowContainer);
        }

        // Piece together into hierarchy
        modal_body.append(setAlternativesArea);

        // Create the modal
        var mod = dialog.modal({
            title: "Set Alternatives",
            body: modal_body,
            default_button: null,

            // Show next dialog on click and pass on value
            buttons: {
                Next: {
                    click: function() {
                        var titles = $(".set-alternatives-title").map(function(_, elem) {
                            return $(elem).val();
                        }).get();

                        var statuses = $(".set-alternatives-status").map(function(_, elem) {
                            return $(elem).is(":checked");
                        }).get();

                        var zipped = titles.map(function(e, i) {
                            return [e, statuses[i]];
                        });

                        data = [];
                        for (let i = 0; i < zipped.length; i++) {
                            data.push({
                                title: zipped[i][0],
                                status: zipped[i][1],
                            })
                        };

                    },
                },
            },
            notebook: Jupyter.notebook,
            keyboard_manager: Jupyter.notebook.keyboard_manager,
        });

        // When the modal opens, populate it with something
        mod.on("shown.bs.modal", function() {

            // Default modal reverts to command mode so we override
            Jupyter.notebook.keyboard_manager.edit_mode();

            // focus on the first input text
            setTimeout(function() {
                $("#set-alternatives-title-1").focus();
            }, 50);

        });
    }

    return {
        createAddAlternativesModal: createAddAlternativesModal,
        createSetAlternativesModal: createSetAlternativesModal,
    };
});