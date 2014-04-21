
var GhostPopover = Ember.Component.extend({
    classNames: 'ghost-popover',
    classNameBindings: ['open'],
    open: function () {
        console.log('observed', this.popover.get('open'));
        return this.get('name') === this.popover.get('activeName') &&
               this.popover.get('open');
    }.property('popover.open'),
    click: function (e) {
        console.log('ghostPopover:click', e, arguments);
        e.preventDefault();
    }
});

export default GhostPopover;