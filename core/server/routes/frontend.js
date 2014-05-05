/*global require, module */

var frontend = require('../controllers/frontend'),
    config = require('../config'),
    Router = require('./router'),
    api = require('../api'),

    ONE_HOUR_S = 60 * 60,
    ONE_YEAR_S = 365 * 24 * ONE_HOUR_S;

module.exports = function () {
    var router = new Router(),
        subdir = config().paths.subdir;

    // ### Redirect '/feed' to '/rss'
    router.get('feed', '/feed/', function redirect(req, res, next) {
        res.set({'Cache-Control': 'public, max-age=' + ONE_YEAR_S});
        res.redirect(301, subdir + '/rss/');
    });

    // ### Multiple posts routes
    router.get('browse_tags_page', '/tag/:tag/page/:page/', frontend.tag);
    router.get('browse_tags', '/tag/:tag/', frontend.tag);
    router.get('browse_pages', '/page/:page/', frontend.homepage);
    router.get('browse', '/', frontend.homepage);

    // ### RSS routes
    router.get('rss_tags_page', '/rss/:tag/page/:page/', frontend.rss);
    router.get('rss_tags', '/rss/:tag/', frontend.rss);
    router.get('rss_page', '/rss/page/:page/', frontend.rss);
    router.get('rss', '/rss/', frontend.rss);

    // ### Middleware to handle permalinks
    router.use(function(req, res, next) {
        api.settings.read('permalinks').then(function (result) {
            var permalink = result.settings[0].value,
                editFormat = permalink[permalink.length - 1] === '/' ? ':edit?' : '/:edit?';

            // Add the permalink to the frontend router, so we can check it next
            router.get('permalink', permalink + editFormat, frontend.single);
            next();
        });
    });

    // ### Route for a static post
    router.get('static', '/:slug/:edit?', frontend.single);

    return router;
};