
var PopoverService = Ember.Object.extend(Ember.Evented, {
    open: false,
    close: function () {

        this.set('open', false);
    },
    toggle: function (name) {
        console.log('popoverService:toggle');
        this.set('activeName', name);
        this.toggleProperty('open');
    },
    openObserves: function () {
        console.log('openObservesBefore',this.get('open'), arguments);
        var self = this;
        Ember.run.next(function () {
            $(document).one('click.popover', function () {
                self.close();
            });
        });
    }.observes('open')
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
