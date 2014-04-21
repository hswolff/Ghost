
var PopoverService = Ember.Object.extend(Ember.Evented, {
    open: false,
    close: function () {
        if (this.get('justOpened')) {
            this.set('justOpened', false);
            return;
        }
        this.set('open', false);
    },
    toggle: function (name) {
        console.log('popoverService:toggle');
        this.set('activeName', name);
        this.toggleProperty('open');
    },
    openObservesBefore: function () {
        console.log('openObservesBefore',this.get('open'), arguments);
        // Only set this if we're going from not open to open,
        // i.e. false -> true.
        this.set('justOpened', this.get('open') === false);
    }.observesBefore('open')
});

var registerPopover = {
    name: 'registerPopover',

    initialize: function (container, application) {
        application.register('popover:service', PopoverService);
    }
};

var injectPopover = {
    name: 'injectPopover',

    initialize: function (container, application) {
        application.inject('route:application', 'popover', 'popover:service');
        application.inject('view:application', 'popover', 'popover:service');
        application.inject('component:ghost-popover', 'popover', 'popover:service');
    }
};

export {registerPopover, injectPopover};