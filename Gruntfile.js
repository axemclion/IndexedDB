module.exports = function(grunt) {

  // project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    connect: {
      server: {
        options: {
          base: "..",
          port: 8080
        }
      }
    },
    watch: {}
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');


  // default task (no deploy)
  grunt.registerTask('default', ['connect', 'watch']);
};