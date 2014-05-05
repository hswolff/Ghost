/*global require, module */

var express = require('express'),
    methods = require('methods'),
    _       = require('lodash'),
    ghostConfig = require('../config'),

    proto;

proto = module.exports = function () {
    var router = express.Router.apply(this, arguments);

    router.__proto__ = proto;
    router.routes = {};

    router.use(function (req, res, next) {
        req.generatePath = function (name, params, absolute, secure) {
            var route,
                routeParams = _.extend({}, req.params),
                path,
                base,
                config;

            if (name !== undefined && _.isString(name)) {
                if (router.routes[name] === undefined) {
                    throw new Error('Unknown route "' + name + '".');
                }

                route = router.routes[name];
            } else {
                route = req.route;
                secure = absolute;
                absolute = params;
                params = name;
            }

            if (params) {
                _.extend(routeParams, params);
            }

            path = route.path;

            _.forEach(routeParams, function (value, key) {
                var placeholder = new RegExp(':' + key + '[\\?]{0,1}');

                if (value === null) {
                    value = '';
                }

                path = path.replace(placeholder, value);
            });

            path.replace(/\/{2,}/g, '/');

            config = ghostConfig();

            if (absolute) {
                base = (secure && config.urlSSL) ? config.urlSSL : config.url;
            } else {
                base = config.paths.subdir;
            }

            return base + path;
        };

        next();
    });

    return router;
};

_.extend(proto, express.Router().__proto__);

proto.route = function (name, path) {
    var route = express.Router.route.call(this, path);

    this.routes[name] = route;
    route.name = name;

    return route;
};

proto.hasRoute = function (name) {
    return this.routes[name] !== undefined;
};

// create Router#VERB functions
methods.concat('all').forEach(function (method) {
    proto[method] = function (name, path) {
        var route = this.route(name, path);

        route[method].apply(route, [].slice.call(arguments, 2));
        return this;
    };
});