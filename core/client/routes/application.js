var ApplicationRoute = Ember.Route.extend({
    actions: {
        openModal: function (modalName, model) {
            modalName = 'modals/' + modalName;
            // We don't always require a modal to have a controller
            // so we're skipping asserting if one exists
            if (this.controllerFor(modalName, true)) {
                this.controllerFor(modalName).set('model', model);
            }
            return this.render(modalName, {
                into: 'application',
                outlet: 'modal'
            });
        },

        closeModal: function () {
            return this.disconnectOutlet({
                outlet: 'modal',
                parentView: 'application'
            });
        },

        handleErrors: function (errors) {
            this.notifications.clear();
            errors.forEach(function (errorObj) {
                this.notifications.showError(errorObj.message || errorObj);

                if (errorObj.hasOwnProperty('el')) {
                    errorObj.el.addClass('input-error');
                }
            });
        },

        togglePopover: function (name) {
            this.popover.toggle(name);
        }
    }
});

export default ApplicationRoute;