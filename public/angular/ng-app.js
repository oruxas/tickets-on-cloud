/*********************************
TicketSupportApp
*********************************/
var app = angular.module('TicketsSupportApp', ['ngRoute']);

/*********************************
Custom directive for file handling
*********************************/
app.directive('fileModel', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;
            
            element.bind('change', function(){
                scope.$apply(function(){
                modelSetter(scope, element[0].files[0]);
                });
            });
        }
    };
}]);

/*********************************
Custom service for managing Ticket submit
*********************************/
app.service('formSubmitService', ['$http', function($http){

        this.uploadToUrl = function(fd, url){

            $http({
                method : "POST",
                url : url,
                withCredentials: false,
                headers: {'Content-Type': undefined},
                transformRequest: angular.identity,
                params: { fd },

            })

            .success(function(response){
                alert(response);
                console.log(response);
            })

            .error(function(err){
                alert(err);
            });
        }
}]);
/*********************************
Ticket Submit Controller
*********************************/

app.controller('SubmitNewTicketController', function($scope, $http, $location, formSubmitService){
    // Reset fields
    $scope.resetForm = function(){
      $scope.newTicket = {};
    }

    // Submit new ticket
    $scope.submitForm = function(){
        var form = document.getElementsByName('submitNewTicketForm').item(0); 
        // submit form via Angular custom service
        var fd = new FormData(form);
        // formSubmitService.uploadToUrl(fd, 'api/new-ticket/submit');

        // Submit form data
        var formData = {
            ticketType : $scope.newTicket.ticketType,
            firstName : $scope.newTicket.firstName,
            lastName : $scope.newTicket.lastName,
            email : $scope.newTicket.email,
            question : $scope.newTicket.question,
            fileAttachment : []
        };
        // Send 
        $http({
            method : "POST",
            url : "api/new-ticket/submit",
            data : formData
        })
            .success(function (response){
                console.log(response); // logs an object (with success message)
            })
            .error(function(err){
                console.log(err);
            });
    };

    // test server
    $scope.testServer = function(){
       $http({
           method : "GET",
           url : "/api/test/server"
       }).then(function mySuccses(response){
           console.log(response.data);
       }, function myError(response) {
           console.log(response.data)
       });
    };

});

/*********************************
Tickets Board Controller
*********************************/

app.controller('TicketsBoardController', function($rootScope,$scope, $http, $location){
     // fetch data from server
      // $scope.allTickets = [{"id":"9345ee372ee0a0849bfecec6c1ddaacb","key":"9345ee372ee0a0849bfecec6c1ddaacb","value":{"rev":"1-5e4c8294f0d570d000b375d12946500c"}},{"id":"cd6501edebce264f63fe76e8976d3ff9","key":"cd6501edebce264f63fe76e8976d3ff9","value":{"rev":"1-177f41076a7d91b9c64259b9bc26e27e"}}]
    $scope.showAll = function(){
       $http({
           method : "GET",
           url : "/api/fetch/tickets"
       })
        .success(function(response){
            console.log(JSON.stringify(response));
            $scope.allTickets = response;
        })
        .error(function(err){
            console.log(err);
        });
    };

    $scope.expandTicket = function(){

    };
});

/*********************************
Routing
*********************************/

app.config(function($routeProvider) {
  $routeProvider.
    //Root
    when('/submit/new-ticket', {
        templateUrl: 'angular/views/SubmitForm.html',
        controller: 'SubmitNewTicketController'
    }).
    when('/show/all-tickets', {
        templateUrl: 'angular/views/TicketsBoard.html',
        controller: 'TicketsBoardController'
    }).
    otherwise({
        redirectTo: '/'
    });
});
