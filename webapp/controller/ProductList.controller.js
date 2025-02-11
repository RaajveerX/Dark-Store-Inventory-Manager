sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox"
], function (Controller, Filter, FilterOperator, Fragment, MessageBox) {
    "use strict";

    return Controller.extend("ui5.darkstores-app.controller.ProductList", {
        onInit() {
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("detail").attachPatternMatched(this._onObjectMatched, this);
        },

        _onObjectMatched(oEvent) {
            const sDarkstorePath = "/" + window.decodeURIComponent(oEvent.getParameter("arguments").darkstorePath);
            this.getView().bindElement({
                path: sDarkstorePath,
                model: "darkstore"
            });
        },

        onFilterProducts: function (oEvent) {
            var aFilter = [];
            var sQuery = oEvent.getParameter("query");
            if (sQuery) {
                aFilter.push(new Filter("name", FilterOperator.Contains, sQuery));
            }

            var oTable = this.byId("productTable");
            var oBinding = oTable.getBinding("items");
            oBinding.filter(aFilter);
        },

        onAddProduct: function () {
            var oView = this.getView();

            if (!this.byId("addProductDialog")) {
                Fragment.load({
                    id: oView.getId(),
                    name: "ui5.darkstores-app.view.AddProductDialog",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    oDialog.open();
                });
            } else {
                this.byId("addProductDialog").open();
            }
        },

        onSaveNewProduct: function () {
            var oModel = this.getView().getModel("darkstore");
            var sPath = this.getView().getBindingContext("darkstore").getPath();
            var oDarkstore = oModel.getProperty(sPath);


            const highestId = Math.max(...oDarkstore.products.map(p => parseInt(p.id.slice(1))), 0);
            const newProductId = `P${highestId + 1}`.padStart(4, '0');

            var oNewProduct = {
                id: newProductId,
                name: this.byId("nameInput").getValue(),
                category: this.byId("categoryInput").getValue(),
                price: parseFloat(this.byId("priceInput").getValue()),
                stock: parseInt(this.byId("stockInput").getValue())
            };
            oDarkstore.products.push(oNewProduct);

            const { id, name, location, capacity, is_active, products } = oDarkstore;
            const { latitude, longitude, address } = location;

            var backendUrl = this.getOwnerComponent().getManifestEntry("/sap.app/dataSources/backend/uri");

            fetch(backendUrl, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    name,
                    latitude,
                    longitude,
                    address,
                    capacity,
                    is_active,
                    products
                })
            })
                .then(response => response.json())
                .then(data => {
                    oModel.setProperty(sPath, data);
                    this.byId("addProductDialog").close();
                })
                .catch(error => console.error('Error:', error));
        },

        onCancelAddProduct: function () {
            this.byId("addProductDialog").close();
        },
        onEditProduct: function (oEvent) {
            var oView = this.getView();
            var oContext = oEvent.getSource().getBindingContext("darkstore");

            if (!this.byId("editProductDialog")) {
                Fragment.load({
                    id: oView.getId(),
                    name: "ui5.darkstores-app.view.EditProductDialog",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    oDialog.bindElement({
                        path: oContext.getPath(),
                        model: "darkstore"
                    });
                    oDialog.open();
                });
            } else {
                var oDialog = this.byId("editProductDialog");
                oDialog.bindElement({
                    path: oContext.getPath(),
                    model: "darkstore"
                });
                oDialog.open();
            }
        },

        onSaveEditProduct: function () {
            var oDialog = this.byId("editProductDialog");
            var oProductContext = oDialog.getBindingContext("darkstore");
            var oProduct = oProductContext.getObject();

            // Get the darkstore context
            var oDarkstoreContext = oProductContext.getModel().getContext(oProductContext.getPath().split("/products")[0]);
            var oDarkstore = oDarkstoreContext.getObject();

            // Get the edited product data
            var oEditedProduct = {
                id: oProductContext.getProperty("id"),
                name: oProductContext.getProperty("name"),
                category: oProductContext.getProperty("category"),
                price: parseFloat(oProductContext.getProperty("price")),
                stock: parseInt(oProductContext.getProperty("stock"))
            };

            // Find and update the product in the darkstore's products array
            var iProductIndex = oDarkstore.products.findIndex(p => p.id === oEditedProduct.id);
            if (iProductIndex !== -1) {
                oDarkstore.products[iProductIndex] = oEditedProduct;
            }

            // Deconstruct the darkstore object
            var { id, name, location, capacity, is_active, products } = oDarkstore;
            var { latitude, longitude, address } = location;

            var backendUrl = this.getOwnerComponent().getManifestEntry("/sap.app/dataSources/backend/uri");

            fetch(backendUrl, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    name,
                    latitude,
                    longitude,
                    address,
                    capacity,
                    is_active,
                    products
                })
            })
                .then(response => response.json())
                .then(data => {
                    var oModel = this.getView().getModel("darkstore");
                    oModel.setProperty(oDarkstoreContext.getPath(), data);
                    oDialog.close();
                })
                .catch(error => console.error('Error:', error));
        },

        onCancelEditProduct: function () {
            this.byId("editProductDialog").close();
        },

        onDeleteProduct: function (oEvent) {
            var oProductContext = oEvent.getSource().getBindingContext("darkstore");
            var oProduct = oProductContext.getObject();
            var sProductId = oProduct.id;

            // Get the darkstore context
            var oDarkstoreContext = oProductContext.getModel().getContext(oProductContext.getPath().split("/products")[0]);
            var oDarkstore = oDarkstoreContext.getObject();

            MessageBox.confirm("Are you sure you want to delete " + oProduct.name + "?", {
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        // Remove the product from the array
                        oDarkstore.products = oDarkstore.products.filter(p => p.id !== sProductId);

                        // Deconstruct the darkstore object
                        var { id, name, location, capacity, is_active, products } = oDarkstore;
                        var { latitude, longitude, address } = location;

                        var backendUrl = this.getOwnerComponent().getManifestEntry("/sap.app/dataSources/backend/uri");

                        fetch(backendUrl, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                id,
                                name,
                                latitude,
                                longitude,
                                address,
                                capacity,
                                is_active,
                                products
                            })
                        })
                            .then(response => response.json())
                            .then(data => {
                                var oModel = this.getView().getModel("darkstore");
                                oModel.setProperty(oDarkstoreContext.getPath(), data);
                            })
                            .catch(error => console.error('Error:', error));
                    }
                }.bind(this)
            });
        }

    });
});
