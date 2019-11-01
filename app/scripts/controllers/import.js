'use strict';

angular
  .module('wcagReporter')
  .controller('ImportCtrl', function (
    fileReader,
    $scope,
    $rootScope,
    evalContextV2
  ) {
    var JSONLD = window.jsonld;
    var FEEDBACK = {
      ERROR: {
        type: 'danger',
        message: 'Import error'
      },
      PENDING: {
        type: 'info',
        message: 'Import pending...'
      },
      SUCCESS: {
        type: 'success',
        message: 'Import successfull'
      }
    };

    $scope.assertionImport = [];

    $scope.allowedMime = [
      'application/json',
      'application/ld+json'
    ].join(',');

    $scope.feedback = false;
    $scope.importFile = undefined;
    $scope.importConfirmed = undefined;

    function resetImport () {
      $scope.feedback = false;
      $scope.importFile = undefined;
      $scope.importConfirmed = undefined;
    }

    function handleLoad (defer, feedback) {
      defer.then(
        function success (result) {
          var resultJson = JSON.parse(result);

          JSONLD.frame(
            resultJson,
            {
              '@context': evalContextV2,
              '@graph': [
                {
                  '@type': 'Assertion'
                }
              ]
            },
            function (error, framed) {
              if (error) {
                feedback = FEEDBACK.ERROR;
                feedback.message = error.message;
                return;
              }

              var graph = framed['@graph'];
              var graphSize = graph.length;

              for (var i = 0; i < graphSize; i++) {
                $scope.assertionImport.push(graph[i]);
              }

              $scope.$apply();
            }
          );
        },
        function error (e) {
          feedback = FEEDBACK.ERROR;
          if (e.message) {
            feedback.message = e.message;
          } else {
            feedback.message = e;
          }
        }
      );
    }

    function isJson (file) {
      if ($scope.allowedMime.indexOf(file.type) >= 0) {
        return true;
      }

      return false;
    }

    $scope.loadFile = function loadFile (source) {
      $scope.feedback = FEEDBACK.PENDING;

      if (!isJson(source)) {
        $scope.feedback = FEEDBACK.ERROR;
        $scope.feedback.message = 'Expected to open a json-file, the filename must end with either “.json” or “.jsonld”.';
        $scope.$apply();

        return;
      }

      $scope.importFile = {
        name: source.name
      };

      handleLoad(fileReader.readAsText(source, $scope), $scope.feedback);
    };

    $scope.handleConfirmation = function handleConfirmation (confirmed) {
      if (confirmed === undefined) {
        confirmed = false;
      }

      if (confirmed) {
        $scope.importConfirmed = confirmed;
        $scope.feedback = FEEDBACK.SUCCESS;
      } else {
        resetImport();
      }
    };

    $scope.handleDoneClick = function handleDoneClick () {
      $rootScope.setEvalLocation();
    };
  });
