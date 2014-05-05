/*global require, module */

var frontend = require('../controllers/frontend'),
    ghostRouter = require('./router'),
    api = require('../api'),

    ONE_HOUR_S = 60 * 60,
    ONE_YEAR_S = 365 * 24 * ONE_HOUR_S;

module.exports = function () {
    var router = ghostRouter();

    // ### Redirect '/feed' to '/rss'
    router.get('feed', '/feed/', function redirect(req, res, next) {
        res.set({'Cache-Control': 'public, max-age=' + ONE_YEAR_S});
        res.redirect(301, req.generatePath('rss'));
    });

    // ### Multiple posts routes
    router.get('browse_tags', '/tag/:tag/:page?/', frontend.tag);
    router.get('browse', '/:page?/', frontend.homepage);

    // ### RSS routes
    router.get('rss_tags_page', '/rss/:tag/page/:page/', frontend.rss);
    router.get('rss_tags', '/rss/:tag/', frontend.rss);
    router.get('rss_page', '/rss/page/:page/', frontend.rss);
    router.get('rss', '/rss/', frontend.rss);

    // ### Add permalink route in extra middleware
    // We need this middleware for keeping a up to date permalink route, because the permalink settings can change after
    // the router has been initialized.
    router.use(function (req, res, next) {
        var permalinkRouter = ghostRouter();

        api.settings.read('permalinks').then(function (result) {
            var permalink = result.settings[0].value,
                editFormat = permalink[permalink.length - 1] === '/' ? ':edit?' : '/:edit?';

            permalinkRouter.get('permalink', permalink + editFormat, frontend.single);
            permalinkRouter(req, res, next);
        });
    });

    // ### Route for a static post
    router.get('static', '/:slug/:edit?', frontend.single);

    return router;
};