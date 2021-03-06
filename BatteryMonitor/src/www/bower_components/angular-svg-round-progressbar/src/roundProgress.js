'use strict';

angular.module('angular-svg-round-progress')
    .directive('roundProgress', ['$window', 'roundProgressService', 'roundProgressConfig', function($window, service, roundProgressConfig){

            var base = {
                restrict: "EA",
                replace: true,
                transclude: true
            };

            if(!service.isSupported){
                return angular.extend(base, {
                    // placeholder element to keep the structure
                    template: '<div class="round-progress" ng-transclude></div>'
                });
            }

            return angular.extend(base, {
                scope:{
                    current:        "=",
                    max:            "=",
                    semi:           "=",
                    rounded:        "=",
                    clockwise:      "=",
                    radius:         "@",
                    color:          "@",
                    bgcolor:        "@",
                    stroke:         "@",
                    iterations:     "@",
                    animation:      "@"
                },
                link: function (scope, element) {
                    var ring        = element.find('path'),
                        background  = element.find('circle'),
                        options     = angular.copy(roundProgressConfig);

                    var renderCircle = function(){
                        var isSemicircle     = options.semi;
                        var radius           = parseInt(options.radius) || 0;
                        var stroke           = parseInt(options.stroke);
                        var diameter         = radius*2;
                        var backgroundSize   = radius - (stroke/2);

                        element.css({
                            "width":        diameter + "px",
                            "height":       (isSemicircle ? radius : diameter) + "px",
                            "overflow":     "hidden" // on some browsers the background overflows, if in semicircle mode
                        });

                        ring.css({
                            "stroke":           options.color,
                            "stroke-width":     stroke,
                            "stroke-linecap":   options.rounded ? "round": "butt"
                        });

                        if(isSemicircle){
                            ring.attr("transform", options.clockwise ? "translate("+ 0 +","+ diameter +") rotate(-90)" : "translate("+ diameter +", "+ diameter +") rotate(90) scale(-1, 1)");
                        }else{
                            ring.attr("transform", options.clockwise ? "" : "scale(-1, 1) translate("+ (-diameter) +" 0)");
                        }

                        background.attr({
                            "cx":           radius,
                            "cy":           radius,
                            "r":            backgroundSize >= 0 ? backgroundSize : 0
                        }).css({
                            "stroke":       options.bgcolor,
                            "stroke-width": stroke
                        });
                    };

                    var renderState = function(newValue, oldValue){
                        if(!angular.isDefined(newValue)){
                            return false;
                        }

                        var max                 = service.toNumber(options.max || 0);
                        var current             = newValue > max ? max : (newValue < 0 ? 0 : newValue);
                        var start               = (oldValue === current || oldValue < 0) ? 0 : (oldValue || 0); // fixes the initial animation
                        var changeInValue       = current - start;

                        var easingAnimation     = service.animations[options.animation];
                        var currentIteration    = 0;
                        var totalIterations     = parseInt(options.iterations);

                        var radius              = options.radius;
                        var circleSize          = radius - (options.stroke/2);
                        var elementSize         = radius*2;

                        (function animation(){
                            service.updateState(
                                easingAnimation(currentIteration, start, changeInValue, totalIterations),
                                max,
                                circleSize,
                                ring,
                                elementSize,
                                options.semi);

                            if(currentIteration < totalIterations){
                                $window.requestAnimationFrame(animation);
                                currentIteration++;
                            }
                        })();
                    };

                    scope.$watchCollection('[current, max, semi, rounded, clockwise, radius, color, bgcolor, stroke, iterations]', function(newValue, oldValue, scope){

                        // pretty much the same as angular.extend,
                        // but this skips undefined values and internal angular keys
                        angular.forEach(scope, function(value, key){
                            // note the scope !== value is because `this` is part of the scope
                            if(key.indexOf('$') && scope !== value && angular.isDefined(value)){
                                options[key] = value;
                            }
                        });

                        renderCircle();
                        renderState(service.toNumber(newValue[0]), service.toNumber(oldValue[0]));
                    });
                },
                template:[
                    '<svg class="round-progress" xmlns="http://www.w3.org/2000/svg">',
                        '<circle fill="none"/>',
                        '<path fill="none"/>',
                        '<g ng-transclude></g>',
                    '</svg>'
                ].join('\n')
            });

        }]);
