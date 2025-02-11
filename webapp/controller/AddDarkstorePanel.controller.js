sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
], (Controller,
    MessageToast,
    JSONModel,) => {
    "use strict";

    return Controller.extend("ui5.darkstores-app.controller.AddDarkstorePanel", {
        /**
         * @override
         */

        //  Defining the new darkstore data model
        onInit: function () {
            const oData = {
                darkstore: {
                    name: "",
                    location: {
                        latitude: "",
                        longitude: "",
                        address: "",
                    },
                    capacity: 100,
                    isActive: false,
                    products: []
                }
            }

            const oModel = new JSONModel(oData)
            this.getView().setModel(oModel)
        },

        //  Makes a call to the backend to add a particular darkstore
        onAddDarkstore: function () {

            // Get current model's property
            var oView = this.getView();
            var oDarkstoreModel = oView.getModel();
            var oNewDarkstore = oDarkstoreModel.getProperty("/darkstore");

            //  Validation, we need all fields filled
            if (!oNewDarkstore.name || !oNewDarkstore.location.address ||
                !oNewDarkstore.location.latitude || !oNewDarkstore.location.longitude) {
                MessageToast.show("Please fill in all required fields.");
                return;
            }

            //Preparing JSON object to send to the backend
            var oPayload = {
                name: oNewDarkstore.name,
                latitude: oNewDarkstore.location.latitude,
                longitude: oNewDarkstore.location.longitude,
                address: oNewDarkstore.location.address,
                capacity: 100, //New darkstore capacity is 100 by default
                is_active: false, // New darkstore is first inactive
                products: [] //New darkstore starts with no products
            };

            fetch('https://us-central1-studied-slate-449918-f2.cloudfunctions.net/function-1', {
                method: 'POST',
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
                    // Handle successful response
                    MessageToast.show("Darkstore added successfully!");
                    window.location.reload();
                })
                .catch(error => {
                    // Handle errors
                    console.error('Error:', error);
                    MessageToast.show("Error adding darkstore. Please try again.");
                });

        },
    });
});
