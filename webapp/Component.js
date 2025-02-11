sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/model/json/JSONModel"
], (UIComponent, JSONModel) => {
	"use strict";

	return UIComponent.extend("ui5.darkstores-app.Component", {
		metadata: {
			interfaces: ["sap.ui.core.IAsyncContentCreation"],
			manifest: "json"
		},
		init() {
			// call the init function of the parent
			UIComponent.prototype.init.apply(this, arguments);

			// set data model on view
			const oData = {
				darkstore: {
					name:"",
                    address:"",
                    latitude:0,
                    longitude:0,
				}
			};
			const oModel = new JSONModel(oData);
			this.setModel(oModel);

            this.getRouter().initialize();
      
		}
	});
});
