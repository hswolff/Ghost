/*global require, module */

var express = require('express'),
    methods = require('methods'),
    _       = require('lodash'),

    proto;

proto = module.exports = function () {
    var router = express.Router.apply(this, arguments);

    router.__proto__ = proto;
    router.routes = {};

    return router;
};

_.extend(proto, express.Router().__proto__);

proto.route = function (name, path) {
    var route = express.Router.route.call(this, path);

    this.routes[name] = path;
    route.name = name;

    return route;
};

// create Router#VERB functions
methods.concat('all').forEach(function (method) {
    proto[method] = function (name, path) {
        var route = this.route(name, path);

        route[method].apply(route, [].slice.call(arguments, 2));
        return this;
    };
});