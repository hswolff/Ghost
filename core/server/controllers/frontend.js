/**
 * Main controller for Ghost frontend
 */

/*global require, module */

var moment = require('moment'),
    RSS = require('rss'),
    _ = require('lodash'),
    url = require('url'),
    when = require('when'),

    api = require('../api'),
    config = require('../config'),
    filters = require('../../server/filters'),
    template = require('../helpers/template'),

    frontendControllers;

function formatPageResponse(posts, page) {
    return {
        posts: posts,
        pagination: page.meta.pagination
    };
}

function handleError(next) {
    return function (err) {
        var e = new Error(err.message);
        e.status = err.code;
        return next(e);
    };
}

// Add Request context parameter to the data object
// to be passed down to the templates
function setReqCtx(req, data) {
    (Array.isArray(data) ? data : [data]).forEach(function (d) {
        d.secure = req.secure;
    });
}

// A private controller fetching multiple posts
function findPage(req, res, next) {
    // The post browse options
    var options = {
        page: 1
    };

    return when.promise(function (resolve) {
        var newRoute;

        if (req.params.page !== undefined) {
            options.page = parseInt(req.params.page, 10);

            if (isNaN(options.page)) {
                // We have a non numeric value so pass this back to the router
                return next();
            }

            if (options.page === 1) {
                // The page is 1, so redirect to remove page number from url
                newRoute = req.route.name;
                // TODO find a better solution for nested optional parts of an url e.g. "/tags/:tag/(page/:page/)?"
                newRoute = newRoute.substring(0, newRoute.indexOf('.page'));
                return res.redirect(req.generatePath(newRoute));
            }
        }

        if (req.params.tag !== undefined) {
            options.tag = req.params.tag;
        }

        // Options are ready so resolve to fetch posts per page and browse the posts
        resolve();
    }).then(function () {
        return api.settings.read('postsPerPage').then(function (response) {
            var postsPerPage = parseInt(response.settings[0].value, 10);

            // No negative posts per page, must be a number
            if (!isNaN(postsPerPage) && postsPerPage > 0) {
                options.limit = postsPerPage;
            }
        }).then(function () {
            options.include = 'author,tags,fields';

            return api.posts.browse(options);
        }).then(function (page) {
            if (options.page > page.meta.pagination.pages) {
                return res.redirect(req.generatePath({ page: page.meta.pagination.pages }));
            }

            return when(page);
        }).otherwise(handleError(next));
    });
}

frontendControllers = {
    'homepage': function (req, res, next) {
        findPage(req, res, next).then(function (page) {
            setReqCtx(req, page.posts);

            // Render the page of posts
            filters.doFilter('prePostsRender', page.posts).then(function (posts) {
                res.render('index', formatPageResponse(posts, page));
            });
        });
    },
    'tag': function (req, res, next) {
        findPage(req, res, next).then(function (page) {
            setReqCtx(req, page.posts);
            if (page.meta.filters.tags) {
                setReqCtx(req, page.meta.filters.tags[0]);
            }

            // Render the page of posts
            filters.doFilter('prePostsRender', page.posts).then(function (posts) {
                api.settings.read('activeTheme').then(function (response) {
                    var activeTheme = response.settings[0],
                        paths = config().paths.availableThemes[activeTheme.value],
                        view = paths.hasOwnProperty('tag.hbs') ? 'tag' : 'index',

                    // Format data for template
                        result = _.extend(formatPageResponse(posts, page), {
                            tag: page.meta.filters.tags ? page.meta.filters.tags[0] : ''
                        });

                    res.render(view, result);
                });
            });
        });
    },
    'single': function (req, res, next) {
        var options = _.pick(req.params, 'slug', 'id'),
            params = {};

        options.include = 'author,tags,fields';

        api.posts.read(options).then(function (result) {
            var post = result.posts[0],
                slugDate = [],
                slugFormat = [];

            function render() {
                // If we're ready to render the page but the last param is 'edit' then we'll send you to the edit page.
                if (params.edit === 'edit') {
                    return res.redirect(config().paths.subdir + '/ghost/editor/' + post.id + '/');
                }

                setReqCtx(req, post);

                filters.doFilter('prePostsRender', post).then(function (post) {
                    api.settings.read('activeTheme').then(function (response) {
                        var activeTheme = response.settings[0],
                            paths = config().paths.availableThemes[activeTheme.value],
                            view = template.getThemeViewForPost(paths, post);

                        res.render(view, {post: post});
                    });
                });
            }

            // If we've checked the path with the static permalink structure
            // then the post must be a static post.
            // If it is not then we must continue router handling.
            if (req.route.name === 'static') {
                if (post.page !== 1) {
                    return next();
                }
            }

            // If there is any date based paramter in the slug
            // we will check it against the post published date
            // to verify it's correct.
            if (params.year || params.month || params.day) {
                if (params.year) {
                    slugDate.push(params.year);
                    slugFormat.push('YYYY');
                }

                if (params.month) {
                    slugDate.push(params.month);
                    slugFormat.push('MM');
                }

                if (params.day) {
                    slugDate.push(params.day);
                    slugFormat.push('DD');
                }

                slugDate = slugDate.join('/');
                slugFormat = slugFormat.join('/');

                if (slugDate === moment(post.published_at).format(slugFormat)) {
                    return render();
                }

                return next();
            }

            render();

        }).otherwise(handleError(next));
    },
    'rss': function (req, res, next) {
        return when.settle([
            findPage(req, next),
            api.settings.read('title'),
            api.settings.read('description'),
            api.settings.read('permalinks')
        ]).then(function (result) {
            var page = result[0],
                title = result[1].value.settings[0].value,
                description = result[2].value.settings[0].value,
                permalinks = result[3].value.settings[0],
                siteUrl = config.urlFor('home', {secure: req.secure}, true),
                feedUrl = config.urlFor('rss', {secure: req.secure}, true),
                feedItems = [],
                feed;

            if (req.params.tag !== undefined) {
                if (page.meta.filters.tags) {
                    title = page.meta.filters.tags[0].name + ' - ' + title;
                    feedUrl = feedUrl + 'tag/' + page.meta.filters.tags[0].slug + '/';
                }
            }

            feed = new RSS({
                title: title,
                description: description,
                generator: 'Ghost v' + res.locals.version,
                feed_url: feedUrl,
                site_url: siteUrl,
                ttl: '60'
            });

            setReqCtx(req, page.posts);

            filters.doFilter('prePostsRender', page.posts).then(function (posts) {
                posts.forEach(function (post) {
                    var deferred = when.defer(),
                        item = {
                            title: post.title,
                            guid: post.uuid,
                            url: config.urlFor('post', {post: post, permalinks: permalinks}, true),
                            date: post.published_at,
                            categories: _.pluck(post.tags, 'name'),
                            author: post.author ? post.author.name : null
                        },
                        content = post.html;

                    //set img src to absolute url
                    content = content.replace(/src=["|'|\s]?([\w\/\?\$\.\+\-;%:@&=,_]+)["|'|\s]?/gi, function (match, p1) {
                        /*jslint unparam:true*/
                        p1 = url.resolve(siteUrl, p1);
                        return "src='" + p1 + "' ";
                    });
                    //set a href to absolute url
                    content = content.replace(/href=["|'|\s]?([\w\/\?\$\.\+\-;%:@&=,_]+)["|'|\s]?/gi, function (match, p1) {
                        /*jslint unparam:true*/
                        p1 = url.resolve(siteUrl, p1);
                        return "href='" + p1 + "' ";
                    });
                    item.description = content;
                    feed.item(item);
                    feedItems.push(deferred.promise);
                    deferred.resolve();
                });
            });

            when.all(feedItems).then(function () {
                res.set('Content-Type', 'text/xml; charset=UTF-8');
                res.send(feed.xml());
            });
        }).otherwise(handleError(next));
    }
};

module.exports = frontendControllers;
