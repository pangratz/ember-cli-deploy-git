/* jshint node: true */
'use strict';

var DeployPluginBase = require('ember-cli-deploy-plugin');
var path = require('path');
var git = require('./lib/git');

module.exports = {
  name: 'ember-cli-deploy-git',

  createDeployPlugin: function(options) {
    var DeployPlugin = DeployPluginBase.extend({
      name: options.name,
      configure: function(context) {
        var pluginConfig = context.config[this.name] || {};
        return getMyRepo(context).then(function(myRepo) {
          return {
            gitDeploy: {
              myRepo: myRepo,
              repo: pluginConfig.repo || myRepo,
              branch: pluginConfig.branch || 'gh-pages',
              worktreePath: pluginConfig.worktreePath || defaultWorktree(context)
            }
          };
        }).catch(showStderr(context.ui));
      },
      upload: function(context) {
        var d = context.gitDeploy;
        var distDir = context.distDir || path.join(context.project.root, 'dist');
        return git.prepareTree(d.worktreePath, d.myRepo, d.repo, d.branch)
          .then(function(){
            return git.replaceTree(d.worktreePath, distDir);
          }).then(function(didCommit){
            if (didCommit) {
              return git.push(d.worktreePath, d.repo, d.branch);
            } else {
              console.log("Nothing to deploy");
            }
          }).catch(showStderr(context.ui));
      }
    });
    return new DeployPlugin();
  }


};

function showStderr(ui) {
  return function(err) {
    if (err.stderr) {
      ui.write(err.stderr);
    }
    throw err;
  };
}

function getMyRepo(context) {
  return git.origin(context.project.root);
}

function defaultWorktree(context) {
  return path.join(context.project.root, '../deploy-' + context.project.name());
}
