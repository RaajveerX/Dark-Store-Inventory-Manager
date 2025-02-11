// path="/" controls the list of darkstores and filtering

sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], (Controller, JSONModel, Filter, FilterOperator) => {
	"use strict";

	return Controller.extend("ui5.darkstores-app.controller.DarkstoreList", {


        /**
         * @override
         */
        onInit: function() {

            var backendUrl = this.getOwnerComponent().getManifestEntry("/sap.app/dataSources/backend/uri");

    
            var oModel = new JSONModel(backendUrl)
            this.getView().setModel(oModel)
        
        },
		
        //Search filter
        onFilterDarkstores(oEvent) {
            const aFilter = []
            const sQuery = oEvent.getParameter("query");
            if (sQuery) {
                aFilter.push(new Filter("location/address", FilterOperator.Contains, sQuery))
            }

            // filter binding
			const oList = this.byId("darkstoreList");
			const oBinding = oList.getBinding("items");
			oBinding.filter(aFilter);
        },

        // Routing to the detail view
        onPress(oEvent) {
            const oItem = oEvent.getSource();
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("detail",{
                darkstorePath: window.encodeURIComponent(oItem.getBindingContext("darkstore").getPath().substr(1))
            })
            
        }
        
	});
});