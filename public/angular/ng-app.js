/*********************************
TicketSupportApp
*********************************/
var app = angular.module('TicketsSupportApp', ['ngRoute']);

/*********************************
Ticket Submit Controller
*********************************/

app.controller('SubmitNewTicketController', function($scope, $http, $location){
    // Reset fields
    $scope.resetForm = function(){
      $scope.newTicket = {};
    }

    // Submit new ticket
    $scope.submitForm = function(newTicket){
      $scope.sentTicket = newTicket;

      $http({
         method: 'POST',
         url: '/api/new-ticket/submit',
         data: {
                 'ticketType': $scope.newTicket.ticketType,
                 'firstName': $scope.newTicket.firstName,
                 'lastName' : $scope.newTicket.lastName,
                 'email' : $scope.newTicket.email,
                 'question' : $scope.newTicket.question,
                 'file' : $scope.newTicket.file
               }
      })
        .success(function(response){
            alert(response);
            $location.path('/ticketsBoard');
        })
        .error(function(response){
            alert(response);
        });
    };
});

/*********************************
Tickets Board Controller
*********************************/

app.controller('TicketsBoardController', function($scope, $http, $location){
    
});

/*********************************
Routing
*********************************/

app.config(function($routeProvider) {
  $routeProvider.
    //Root
    when('/', {
        templateUrl: 'angular/views/SubmitForm.html',
        controller: 'SubmitNewTicketController'
    }).
    when('/ticketsBoard', {
        templateUrl: 'angular/views/ticketsBoard.html',
        controller: 'ticketsBoardController'
    });
    // otherwise({
    //     redirectTo: '/'
    // });
});
