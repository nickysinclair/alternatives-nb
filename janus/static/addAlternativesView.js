/*
 * Dialog for add alternatives
 */

define([
    "jquery",
    "base/js/namespace",
    "base/js/dialog",
    "base/js/utils",
], function($, Jupyter, dialog, utils) {
    var rationales = {
        decisionRationale: [
            "methodology",
            "prior work",
            "data",
            "expertise",
            "communication",
            "sensitivity",
        ],
        alternativesTrigger: [
            "opportunism",
            "systematicity",
            "robustness",
            "contingency",
        ],
    };

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

        // Grid wrapper to be stylized for forming input fields into grid
        var setAlternativesGridWrapper = $(
            "<div/ class='set-alternatives-grid-wrapper'>"
        );
        setAlternativesArea.append(setAlternativesGridWrapper);

        // For each desired alternative lay out input fields
        // For layout style, consider using CSS grids:
        //  - https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout
        //  - https://gridbyexample.com/examples/
        for (let i = 0; i < numAlternatives; i++) {
            var rowContainer = $("<div class='set-alternatives-container'/>");

            /*
             * TITLES
             */
            var setAlternativesTitle = $("<input>");
            setAlternativesTitle.attr({
                id: `#set-alternatives-title-${i + 1}`,
                class: `set-alternatives-title`,
                type: "text",
                value: `Untitled Alternative ${i + 1}`,
            });
            rowContainer.append(setAlternativesTitle);

            /*
             * STATUSES
             */
            var setAlternativesStatus = $("<input>");
            setAlternativesStatus.attr({
                id: `#set-alternatives-status-${i + 1}`,
                class: `set-alternatives-status`,
                type: "checkbox",
            });
            rowContainer.append(setAlternativesStatus);

            /*
             * ALTERNATIVES TRIGGERS
             */
            var setAlternativesTrigger = $("<select>");
            setAlternativesTrigger.attr({
                id: `#set-alternatives-trigger-${i + 1}`,
                class: `set-alternatives-trigger`,
                multiple: true,
            });
            for (let i = 0; i < rationales.alternativesTrigger.length; i++) {
                setAlternativesTrigger.append(
                    $(
                        `<option value="${rationales.alternativesTrigger[i]}">${rationales.alternativesTrigger[i]}</option>`
                    )
                );
            }
            rowContainer.append(setAlternativesTrigger);

            /*
             * DECISION RATIONALES
             */
            var setAlternativesDecision = $("<select>");
            setAlternativesDecision.attr({
                id: `#set-alternatives-decision-${i + 1}`,
                class: `set-alternatives-decision`,
                multiple: true,
            });
            for (let i = 0; i < rationales.decisionRationale.length; i++) {
                setAlternativesDecision.append(
                    $(
                        `<option value="${rationales.decisionRationale[i]}">${rationales.decisionRationale[i]}</option>`
                    )
                );
            }
            rowContainer.append(setAlternativesDecision);

            setAlternativesGridWrapper.append(rowContainer);
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
                        /*
                         * TITLES
                         */
                        var titles = $(".set-alternatives-title")
                            .map(function(_, elem) {
                                return $(elem).val();
                            })
                            .get();

                        /*
                         * STATUSES
                         */
                        var statuses = $(".set-alternatives-status").get();
                        for (let i = 0; i < statuses.length; i++) {
                            if ($(statuses[i]).is(":checked")) {
                                statuses[i] = "choice";
                            } else {
                                statuses[i] = "option";
                            }
                        }

                        /*
                         * ALTERNATIVES TRIGGERS
                         */

                        // Set a dictionary with key as alternatives trigger container
                        // and empty list to be populated with selected options
                        var selectedTriggers = {};
                        var triggerContainers = $(".set-alternatives-trigger")
                            .each(function(_, elem) {
                                var id = $(elem).prop("id");
                                return id;
                            })
                            .get();
                        var triggerContainers = triggerContainers.map(function(i, _) {
                            return $(i).prop("id");
                        });
                        for (let i = 0; i < triggerContainers.length; i++) {
                            selectedTriggers[triggerContainers[i]] = [];
                        }

                        // Loop through displayed options and add selected
                        // options to relevant container
                        var triggerOptions = $(".set-alternatives-trigger option");
                        var triggerOptionsParents = triggerOptions
                            .map(function(e, i) {
                                return $(i).parent();
                            })
                            .get();
                        for (let i = 0; i < triggerOptions.length; i++) {
                            if ($(triggerOptions[i]).is(":selected")) {
                                containerID = triggerOptionsParents[i].get()[0].id;
                                selectedTriggers[containerID].push($(triggerOptions[i]).val());
                            }
                        }

                        /*
                         * DECISION RATIONALES
                         */
                        // Set a dictionary with key as alternatives trigger container
                        // and empty list to be populated with selected options
                        var selectedDecisions = {};
                        var decisionContainers = $(".set-alternatives-decision")
                            .each(function(_, elem) {
                                var id = $(elem).prop("id");
                                return id;
                            })
                            .get();
                        var decisionContainers = decisionContainers.map(function(i, _) {
                            return $(i).prop("id");
                        });
                        for (let i = 0; i < decisionContainers.length; i++) {
                            selectedDecisions[decisionContainers[i]] = [];
                        }

                        // Loop through displayed options and add selected
                        // options to relevant container
                        var decisionOptions = $(".set-alternatives-decision option");
                        var decisionOptionsParents = decisionOptions
                            .map(function(_, i) {
                                return $(i).parent();
                            })
                            .get();
                        for (let i = 0; i < decisionOptions.length; i++) {
                            if ($(decisionOptions[i]).is(":selected")) {
                                containerID = decisionOptionsParents[i].get()[0].id;
                                selectedDecisions[containerID].push(
                                    $(decisionOptions[i]).val()
                                );
                            }
                        }

                        // Zip it all together

                        // Extract just values from dictionaries
                        var triggers = Object.values(selectedTriggers);
                        var decisions = Object.values(selectedDecisions);
                        var zipped = titles.map(function(e, i) {
                            return [e, statuses[i], triggers[i], decisions[i]];
                        });

                        data = [];
                        for (let i = 0; i < zipped.length; i++) {
                            data.push({
                                title: zipped[i][0],
                                status: zipped[i][1],
                                triggers: zipped[i][2],
                                decision: zipped[i][3],
                            });
                        }

                        // TODO : Send this data off to be generate new
                        // interactivity in DOM and store in metadata
                        console.log(data);
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

            // Focus on the first input text
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