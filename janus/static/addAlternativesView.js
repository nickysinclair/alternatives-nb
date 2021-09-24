/*
 * Dialog for add alternatives
 */

define([
  "jquery",
  "base/js/namespace",
  "base/js/dialog",
  "../janus/alternativeController",
], function ($, Jupyter, dialog, alternativeController) {
  var input_options = {
    statuses: ["Choice", "Option", "Archived"],
    decisionRationale: [
      "Methodology",
      "Prior work",
      "Data",
      "Expertise",
      "Communication",
      "Sensitivity",
    ],
    alternativesTrigger: [
      "Opportunism",
      "Systematicity",
      "Robustness",
      "Contingency",
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
          click: function () {
            createSetAlternativesModal($("#add-alternatives-box").val());
          },
        },
      },
      notebook: Jupyter.notebook,
      keyboard_manager: Jupyter.notebook.keyboard_manager,
    });

    // When the modal opens, populate it with something
    mod.on("shown.bs.modal", function () {
      // focus the comment bar after a slight delay
      setTimeout(function () {
        $("#add-alternatives-box").focus();
      }, 50);
    });
  }

  function createSetAlternativesModal(numAlternatives, kb, nb) {
    /* show the add alternatives modal */

    // HTML body container
    var modal_body = $("<div/>");

    // Main area for setting alternatives
    var setAlternativesArea = $("<div>").addClass("set-alternatives-area");

    // Table containing input fields in grid
    var setAlternativesTable = $("<div>").addClass("set-alternatives-table");
    setAlternativesArea.append(setAlternativesTable);

    // Header container
    var thead = $("<div>").addClass("set-alternatives-header");
    setAlternativesTable.append(thead);

    // Add the actual column names into header
    var headers = [
      "Title",
      "Status",
      "Alternative Trigger",
      "Decision Rationale",
    ];
    for (let i = 0; i < headers.length; i++) {
      let head = headers[i];
      let span = $("<span>").addClass("th").text(head);
      thead.append(span);
    }

    // Body container
    var tbody = $("<div>").addClass("tbody");
    setAlternativesTable.append(tbody);

    // Add each alternative's input fields
    for (let i = 0; i < numAlternatives; i++) {
      // Row container
      var row = $("<div>").addClass("tr");

      /*
       * TITLES
       */
      var setAlternativesTitle = $("<span>")
        .addClass("td")
        .addClass("set-alternatives-title");
      var setAlternativesTitleInput = $("<input>").attr({
        id: `#set-alternatives-title-${i + 1}`,
        type: "text",
        placeholder: `Untitled Alternative ${i + 1}`,
      });
      setAlternativesTitleInput = setAlternativesTitleInput.addClass(
        "set-alternatives-title-input"
      );
      setAlternativesTitle.append(setAlternativesTitleInput);
      row.append(setAlternativesTitle);

      /*
       * STATUSES
       */
      var setAlternativesStatus = $("<span>")
        .addClass("td")
        .addClass("set-alternatives-status");
      for (let j = 0; j < input_options.statuses.length; j++) {
        let status = input_options.statuses[j];
        let container = $("<div>").addClass("set-alternative-status-item");
        let input = $("<input>").prop("type", "radio");
        input = input
          .prop("name", `radio-button-${i}`)
          .addClass("set-alternatives-status-input");

        if (status === "Option") {
          input = input.prop("checked", "checked");
        }

        container.append(input);
        let span = $("<span>").text(status);
        container.append(span);
        setAlternativesStatus.append(container);
      }
      row.append(setAlternativesStatus);

      /*
       * ALTERNATIVES TRIGGERS
       */
      var setAlternativesTrigger = $("<span>")
        .addClass("td")
        .addClass("set-alternatives-trigger");
      for (let k = 0; k < input_options.alternativesTrigger.length; k++) {
        let trigger = input_options.alternativesTrigger[k];
        let container = $("<div>").addClass("set-alternative-trigger-item");
        let input = $("<input>")
          .prop("type", "checkbox")
          .addClass("set-alternatives-trigger-input");
        input = input.prop("name", trigger);
        container.append(input);
        let span = $("<span>").text(trigger);
        container.append(span);
        setAlternativesTrigger.append(container);
      }
      row.append(setAlternativesTrigger);

      /*
       * DECISION RATIONALES
       */
      var setAlternativesDecision = $("<span>")
        .addClass("td")
        .addClass("set-alternatives-decision");
      for (let l = 0; l < input_options.decisionRationale.length; l++) {
        let decision = input_options.decisionRationale[l];
        let container = $("<div>").addClass("set-alternative-decision-item");
        let input = $("<input>")
          .prop("type", "checkbox")
          .addClass("set-alternatives-decision-input");
        input = input.prop("name", decision);
        container.append(input);
        let span = $("<span>").text(decision);
        container.append(span);
        setAlternativesDecision.append(container);
      }
      row.append(setAlternativesDecision);

      setAlternativesTable.append(row);
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
          click: function () {
            /*
             * TITLES
             */
            var inputTitles = $(".set-alternatives-title-input")
              .map(function (_, elem) {
                return $(elem).val();
              })
              .get();
            var placeholderTitles = $(".set-alternatives-title-input")
              .map(function (_, elem) {
                return $(elem).prop("placeholder");
              })
              .get();

            var titles = [];
            for (let i = 0; i < inputTitles.length; i++) {
              if (inputTitles[i] === "") {
                titles.push(placeholderTitles[i]);
              } else {
                titles.push(inputTitles[i]);
              }
            }

            /*
             * STATUSES
             */
            var inputStatuses = $(".set-alternatives-status-input").get();
            var statuses = [];
            for (let i = 0; i < inputStatuses.length; i++) {
              if ($(inputStatuses[i]).is(":checked")) {
                let span = $(inputStatuses[i]).siblings()[0];
                statuses.push($(span).text());
              }
            }

            /*
             * ALTERNATIVES TRIGGERS
             * Generate list of lists, with each inner list for an alternative row
             */

            var triggers = [];
            var inputTriggers = $(".set-alternatives-trigger-input").get();
            var numTriggerOptions = inputTriggers.length / numAlternatives;
            for (let i = 0; i < inputTriggers.length; i++) {
              if (i % numTriggerOptions === 0) {
                var triggersRow = [];
              }
              if ($(inputTriggers[i]).is(":checked")) {
                let trigger = $(inputTriggers[i]).prop("name");
                triggersRow.push(trigger);
              }

              if (i % numTriggerOptions === numTriggerOptions - 1) {
                triggers.push(triggersRow);
              }
            }

            /*
             * DECISION RATIONALES
             * Generate list of lists, with each inner list for an alternative row
             */
            var decisions = [];
            var inputDecisions = $(".set-alternatives-decision-input").get();
            var numDecisionOptions = inputDecisions.length / numAlternatives;
            for (let i = 0; i < inputDecisions.length; i++) {
              if (i % numDecisionOptions === 0) {
                var decisionsRow = [];
              }
              if ($(inputDecisions[i]).is(":checked")) {
                let decision = $(inputDecisions[i]).prop("name");
                decisionsRow.push(decision);
              }

              if (i % numDecisionOptions === numDecisionOptions - 1) {
                decisions.push(decisionsRow);
              }
            }

            // Zip it all together
            var zipped = titles.map(function (e, i) {
              return [e, statuses[i], triggers[i], decisions[i]];
            });

            data = [];
            for (let i = 0; i < zipped.length; i++) {
              data.push({
                title: zipped[i][0],
                status: zipped[i][1],
                triggers: zipped[i][2],
                decisions: zipped[i][3],
              });
            }

            // Send for alternatives creation
            alternativeController.createAlternativeSet(data);
          },
        },
      },
      notebook: Jupyter.notebook,
      keyboard_manager: Jupyter.notebook.keyboard_manager,
    });

    // When the modal opens, populate it with something
    mod.on("shown.bs.modal", function () {
      // Default modal reverts to command mode so we override
      Jupyter.notebook.keyboard_manager.edit_mode();

      // Focus on the first input text
      setTimeout(function () {
        $("#set-alternatives-title-1").focus();
      }, 50);
    });
  }

  return {
    createAddAlternativesModal: createAddAlternativesModal,
    createSetAlternativesModal: createSetAlternativesModal,
  };
});
