var api         = require('../api'),
    express     = require('express');

module.exports = function (middleware) {
    var router = express.Router();

    // ### API routes
    // #### Posts
    router.get('/ghost/api/v0.1/posts', api.requestHandler(api.posts.browse));
    router.post('/ghost/api/v0.1/posts', api.requestHandler(api.posts.add));
    router.get('/ghost/api/v0.1/posts/:id', api.requestHandler(api.posts.read));
    router.put('/ghost/api/v0.1/posts/:id', api.requestHandler(api.posts.edit));
    router['delete']('/ghost/api/v0.1/posts/:id', api.requestHandler(api.posts.destroy));
    router.get('/ghost/api/v0.1/posts/slug/:title', middleware.authAPI, api.requestHandler(api.posts.generateSlug));
    // #### Settings
    router.get('/ghost/api/v0.1/settings/', api.requestHandler(api.settings.browse));
    router.get('/ghost/api/v0.1/settings/:key/', api.requestHandler(api.settings.read));
    router.put('/ghost/api/v0.1/settings/', api.requestHandler(api.settings.edit));
    // #### Users
    router.get('/ghost/api/v0.1/users/', api.requestHandler(api.users.browse));
    router.get('/ghost/api/v0.1/users/:id/', api.requestHandler(api.users.read));
    router.put('/ghost/api/v0.1/users/:id/', api.requestHandler(api.users.edit));
    // #### Tags
    router.get('/ghost/api/v0.1/tags/', api.requestHandler(api.tags.browse));
    // #### Notifications
    router['delete']('/ghost/api/v0.1/notifications/:id', api.requestHandler(api.notifications.destroy));
    router.post('/ghost/api/v0.1/notifications/', api.requestHandler(api.notifications.add));
    // #### Import/Export
    router.get('/ghost/api/v0.1/db/', api.requestHandler(api.db.exportContent));
    router.post('/ghost/api/v0.1/db/', middleware.busboy, api.requestHandler(api.db.importContent));
    router['delete']('/ghost/api/v0.1/db/', api.requestHandler(api.db.deleteAllContent));
    // #### Mail
    router.post('/ghost/api/v0.1/mail', api.requestHandler(api.mail.send));
    router.post('/ghost/api/v0.1/mail/test', api.requestHandler(api.mail.sendTest));

    return router;
};