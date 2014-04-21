
var ApplicationView = Ember.View.extend({
    click: function () {
        console.log('applicationView', this.get('popover.open'));
        console.log('applicationView',this.get('popover.activeName'));
        this.popover.close();
        this._super();
    }
});

export default ApplicationView;
