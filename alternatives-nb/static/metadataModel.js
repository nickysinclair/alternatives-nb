/**
 * Interfacing with JSON metadata.
 */

// TODO : archiveAlternativeMetadata
// TODO : deleteAlternativeSetMetadata
// TODO : archiveAlternativeSetMetadata

// TODO : addAlternativeMetadataToSet -- ??

define(["require", "jquery", "base/js/namespace", "../alternatives-nb/uuidv4"], function(
    require,
    $,
    Jupyter,
    uuidv4
) {
    function setDefaultAlternativeMetadata(id = null) {
        // TODO : Figure out what to pass in ...
        /**
         * Set the default metadata for a alternative (notebook container)
         */

        if (!id) {
            id = uuidv4();
        }

        var defaultAlternativeMetadata = {
            id: id,
            alternativeSet: "",
            alternativeStatus: "Option",
            alternativeParent: "",
            alternativeChildren: [],
            alternativeReasoning: {
                alternativesTrigger: [],
                decisionRationale: [],
            },
        };

        // Set custom notebook metadata if not existing
        if (Jupyter.notebook.metadata.lit === undefined) {
            setDefaultNotebookMetadata();
        }

        // Add alternative metadata within notebook metadata array
        Jupyter.notebook.metadata.lit.alternatives.push(defaultAlternativeMetadata);

        return defaultAlternativeMetadata;
    }

    function setDefaultNotebookMetadata() {
        /**
         * Set the default metadata on top of which alternative metadata is stored
         */

        var defaultNotebookMetadata = {
            alternatives: [],
        };

        if (Jupyter.notebook.metadata.lit === undefined) {
            Jupyter.notebook.metadata.lit = defaultNotebookMetadata;
        } else {
            for (var key in defaultNotebookMetadata) {
                if (!Jupyter.notebook.metadata.lit.hasOwnProperty(key)) {
                    Jupyter.notebook.metadata.lit[key] = defaultNotebookMetadata[key];
                }
            }
        }
    }

    function updateAlternativeMetadata(alternativeID, data) {
        /**
         * Access an existing alternative and update its metadata with new metadata
         *
         * Expect only data which is to be updated
         *
         * Args:
         *  - alternativeID: alternative object ID (uuid) / `alternative.id`
         *  - data: data to be updated, expected as JSON syntax
         */

        var alternatives = Jupyter.notebook.metadata.lit.alternatives;
        for (let i = 0; i < alternatives.length; i++) {
            // Update the metadata matching `alternativeID`
            var alternative = alternatives[i];
            if (alternative.id === alternativeID) {
                for (var key in data) {
                    // Only update new data
                    if (data[key] != alternative[key]) {
                        alternative[key] = data[key];

                        // TODO : Depending on the data update, might need to
                        // update metadata of other alternatives
                    }
                }

                return alternative;
            }
        }
    }

    function deleteAlternativeMetadata(alternativeID) {
        /**
         * Delete the alternative metadata by ID
         *
         * Args:
         *  - alternativeID: alternative object ID (uuid) / `alternative.id`
         */

        // Retrieve alternatives metadata
        var alternatives = Jupyter.notebook.metadata.lit.alternatives;

        // Extract IDs, find matching index
        var alternativesIDs = alternatives.map(function(e) {
            return e.id;
        });
        // Method from https://stackoverflow.com/questions/5767325/how-can-i-remove-a-specific-item-from-an-array
        var matchIdx = alternativesIDs.indexOf(alternativeID);

        // Splices out alternative JSON object at index
        if (matchIdx > -1) {
            alternatives.splice(matchIdx, 1);
        }

        // Not sure if working with copy or actual JSON so maybe redundant setting
        // Jupyter.notebook.metadata.lit.alternatives = alternatives;
    }

    function deleteAlternativeMetadataRecursively() {
        /** PLEASE NOTE!
         * This is work in progress code to delete nested alternatives through
         * recursion. The code below was outlined for possible use, but as of
         * yet has not been connected with user functionality.
         *
         * This function must be somehow linked or cohesively related to the
         * `deleteAlternativeMetadata` function.
         */

        /**
         * Delete the alternative metadata by ID
         *
         * Args:
         *  - alternativeID: alternative object ID (uuid) / `alternative.id`
         */

        // Retrieve alternatives metadata
        var alternatives = Jupyter.notebook.metadata.lit.alternatives;

        // Get the alternative to be deleted
        for (let i = 0; i < alternatives.length; i++) {
            var alternative = alternatives[i];
            if (alternative.id === alternativeID) {
                break;
            }
        }

        // Define function for recursion
        function getAlternativeChildrenIDs(
            alternatives,
            deleteAlternative,
            deleteChildrenIDs
        ) {
            /**
             * Get all alternatives children using recursion
             * Note that the approach saves the parent and children leading to duplication
             * which is de-duplicated by type casting array to set to array
             *
             * Args:
             *  - alternatives: alternatives in JSON syntax, i.e.
             *      `Jupyter.notebook.metadata.lit.alternatives`
             *  - deleteAlternative: alternative to be deleted in JSON syntax
             *  - deleteChildrenIDs: IDs of the alternative to be deleted and its children
             */

            var deleteChildrenIDs = deleteChildrenIDs;
            deleteChildrenIDs.push(deleteAlternative.id);
            var childrenIDs = deleteAlternative.alternativeChildren;
            for (let i = 0; i < childrenIDs.length; i++) {
                // Save children IDs
                childID = childrenIDs[i];
                deleteChildrenIDs.push(childID);

                // Find the matching alternative and recurse if has children
                for (let j = 0; j < alternatives.length; j++) {
                    if (
                        childID === alternatives[j].id &&
                        alternatives[j].alternativeChildren.length > 0
                    ) {
                        getAlternativeChildrenIDs(
                            alternatives,
                            alternatives[j],
                            deleteChildrenIDs
                        );
                    }
                }
            }

            // De-duplicate using Set()
            return Array.from(new Set(deleteChildrenIDs));
        }

        var deleteChildrenIDs = getAlternativeChildrenIDs(
            alternatives,
            alternative, []
        );

        // TODO : Figure out how to dynamically remove (or does below for loop accomplish just fine?)
        // go to https://stackoverflow.com/questions/5767325/how-can-i-remove-a-specific-item-from-an-array
        // and try using option with header "Edited in October 2016"
        function removeItemAll(arr, value) {
            var i = 0;
            while (i < arr.length) {
                if (arr[i] === value) {
                    arr.splice(i, 1);
                } else {
                    ++i;
                }
            }
            return arr;
        }

        for (let i = 0; i < deleteChildrenIDs.length; i++) {
            alternatives = removeItemAll(alternatives, deleteChildrenIDs[i]);
        }
    }

    return {
        setDefaultAlternativeMetadata: setDefaultAlternativeMetadata,
        setDefaultNotebookMetadata: setDefaultNotebookMetadata,
        updateAlternativeMetadata: updateAlternativeMetadata,
        deleteAlternativeMetadata: deleteAlternativeMetadata,
    };
});