/*********************************
TicketSupportApp
*********************************/
var app = angular.module('TicketsSupportApp', ['ngRoute', 'ui.bootstrap', 'ngAnimate', 'infinite-scroll']);

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

app.controller('TicketsBoardController', function($scope, $http, $location){
    //initialization
    var ticketsCount = 0;
    var last = 0;
    $scope.answState = [];

    angular.element(document).ready(function() {
        $http({
           method : "GET",
           url : "/api/fetch/tickets"
       })
        .success(function(response) {
            console.log(JSON.stringify(response));
            $scope.allTickets = response;
            ticketsCount = $scope.allTickets.length;
                if (ticketsCount) {
                    $scope.tickets = [$scope.allTickets[0]];
                    for (var i = 0; i < ticketsCount; i++) {
                        if ($scope.allTickets[i].data.answer.text != "") {
                            $scope.answState.push(true);
                        } else {
                            $scope.answState.push(false);
                        }
                    }
                } else {
                    console.log('There is no tickets in the db.')
                }
        })
        .error(function(err) {
            console.log(err);
        });
    });

    //show more on scroll
    $scope.loadMore = function(){
        if (last < ticketsCount) {
            last = $scope.tickets.length;
            for(var i = 1; i<= 1; i++) {
                $scope.tickets.push($scope.allTickets[last]);
            }
        }
    };
    $scope.showScope = function(e) {
        console.log(angular.element(e.srcElement).scope());
    };

    $scope.submitAnswer = function(index){
        //take modification
        var ticket = $scope.allTickets[index];
        //send ticket update req to server
        $http({
            method : "PUT",
            url : "api/update/ticket/",
            data : ticket
        })
            .success(function (response){
                //show answer
                $scope.answState[index] = true;
            })
            .error(function(err){
                console.log(err);
            });

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
