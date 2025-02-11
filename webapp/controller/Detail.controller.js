// Contains controls for the detail view
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast"
], (Controller,
    History,
    JSONModel,
    Filter,
    FilterOperator,
    MessageBox,
    Fragment,
    MessageToast) => {
    "use strict";

    return Controller.extend("ui5.darkstores-app.controller.Detail", {

        //Init route
        onInit() {

            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("detail").attachPatternMatched(this._onObjectMatched, this);
        },

        // Retreving Data specific to /darkstore/{id}
        _onObjectMatched(oEvent) {
            this.getView().bindElement({
                path: "/" + window.decodeURIComponent(oEvent.getParameter("arguments").darkstorePath),
                model: "darkstore"
            });
        },

        // Navigating back to '/'
        onNavBack() {
            const oHistory = History.getInstance();
            const sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                const oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("overview", {}, "true");
            }
        },

        // Handles opening the dialog
        onEditPress: function () {
            var oView = this.getView();

            if (!this._oEditDialog) {
                Fragment.load({
                    id: oView.getId(),
                    name: "ui5.darkstores-app.view.EditDarkstore",
                    controller: this
                }).then(function (oDialog) {
                    this._oEditDialog = oDialog;
                    oView.addDependent(this._oEditDialog);
                    this._openEditDialog();
                }.bind(this));
            } else {
                this._openEditDialog();
            }
        },

        onCancelEdit:function(){
            this._oEditDialog.close();

        },

        // Helper for opening the dialog
        _openEditDialog: function () {
            var oView = this.getView();
            var oBindingContext = oView.getBindingContext("darkstore");
            var oDarkstore = oBindingContext.getObject();

            // Create a deep copy of the darkstore object using JSON.parse and JSON.stringify
            var oClonedDarkstore = JSON.parse(JSON.stringify(oDarkstore));

            var oEditDarkstoreModel = new JSONModel(oClonedDarkstore);
            this._oEditDialog.setModel(oEditDarkstoreModel, "editDarkstoreModel"); // Name the model
            this._oEditDialog.open()
        },


        // a PUT call to the cloud run function, when user saves the data
        onSaveEdit: function () {
            var oEditModel = this._oEditDialog.getModel("editDarkstoreModel");
            var oUpdatedDarkstore = oEditModel.getData();
            var oDarkstoreModel = this.getView().getModel("darkstore");
            var aDarkstores = oDarkstoreModel.getProperty("/Darkstores");

            // Find and update the darkstore in the local model
            var iIndex = aDarkstores.findIndex(d => d.id === oUpdatedDarkstore.id);
            if (iIndex !== -1) {
                aDarkstores[iIndex] = oUpdatedDarkstore;
                oDarkstoreModel.setProperty("/Darkstores", aDarkstores);
            }

            // Prepare the data for the API call
            var oPayload = {
                id: oUpdatedDarkstore.id,
                name: oUpdatedDarkstore.name,
                latitude: oUpdatedDarkstore.location.latitude,
                longitude: oUpdatedDarkstore.location.longitude,
                address: oUpdatedDarkstore.location.address,
                capacity: oUpdatedDarkstore.capacity,
                is_active: oUpdatedDarkstore.is_active,
                products: oUpdatedDarkstore.products
            };

            var backendUrl = this.getOwnerComponent().getManifestEntry("/sap.app/dataSources/backend/uri");

            // Make the PUT call to GCP
            fetch(backendUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(oPayload)
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    MessageToast.show("Darkstore updated successfully!");
                    this._oEditDialog.close();
                    var oRouter = this.getOwnerComponent().getRouter();
                    oRouter.navTo("overview", {}, true);
                })
                .catch(error => {
                    console.error('Error:', error);
                    MessageToast.show("Error updating darkstore. Please try again.");
                    // Revert changes in case of error
                    this._revertChanges(aDarkstores, iIndex, oUpdatedDarkstore);
                });

            this._oEditDialog.close();
        },

        _revertChanges: function (aDarkstores, iIndex, oOriginalDarkstore) {
            if (iIndex !== -1) {
                aDarkstores[iIndex] = oOriginalDarkstore;
                this.getView().getModel("darkstore").setProperty("/Darkstores", aDarkstores);
            }
        },

        onDeletePress: function () {
            MessageBox.confirm("Are you sure you want to delete this darkstore?", {
                title: "Confirm Deletion",
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        this._deleteDarkstore();
                    }
                }.bind(this)
            });
        },

        _deleteDarkstore: function () {
            var oBindingContext = this.getView().getBindingContext("darkstore");
            var oDarkstore = oBindingContext.getObject();
            var darkstoreId = oDarkstore.id;

            // Remove the darkstore from the local model
            var oDarkstoreModel = this.getView().getModel("darkstore");
            var aDarkstores = oDarkstoreModel.getProperty("/Darkstores");
            var iIndex = aDarkstores.findIndex(d => d.id === darkstoreId);
            if (iIndex !== -1) {
                aDarkstores.splice(iIndex, 1);
                oDarkstoreModel.setProperty("/Darkstores", aDarkstores);
            }

            var backendUrl = this.getOwnerComponent().getManifestEntry("/sap.app/dataSources/backend/uri");

            // Make the DELETE call to GCP
            fetch(`${backendUrl}?id=${darkstoreId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    MessageToast.show("Darkstore deleted successfully!");
                    var oRouter = this.getOwnerComponent().getRouter();
                    oRouter.navTo("overview", {}, true);
                })
                .catch(error => {
                    console.error('Error:', error);
                    MessageToast.show("Error deleting darkstore. Please try again.");
                    // Revert changes in case of error
                    if (iIndex !== -1) {
                        aDarkstores.splice(iIndex, 0, oDarkstore);
                        oDarkstoreModel.setProperty("/Darkstores", aDarkstores);
                    }
                });
        }


    });
});