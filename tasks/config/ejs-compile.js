module.exports = function (grunt) {
    var folderName = grunt.option('target');
    var productionString = "";
    var jsFiles;
    if (folderName) {
        jsFiles = require("../../" + folderName + "/files.js");
    }
    var env = false;
    var isProduction = grunt.option('production');
    if (isProduction) {
        env = require("../../config/env/production.js");
        productionString = "production";
    } else {
        env = require("../../config/env/development.js");
        productionString = "development";
    }

    grunt.config.set('ejs', {
        ui: {
            src: 'views/' + productionString + "/" + folderName + '.ejs',
            dest: folderName + '/index.html',
            options: {
                _: require("lodash"),
                jsFiles: jsFiles,
                adminurl: env.realHost + "/api/",
            }
        }
    });
    grunt.loadNpmTasks('grunt-ejs-locals');
};