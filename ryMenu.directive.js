/**
 * The ry-menu family of directives defines dropdown-style menu behavior
 * without imposing specific styles. All directives are attributes.
 *
 * Directives:
 *
 * ry-menu         defines the root menu element
 * ry-menu-trigger defines the element that opens and closes the ry-menu-list
 * ry-menu-list    defines the element that is opened and closed
 * ry-menu-item    defines the choices in the ry-menu-list
 *
 * Hooks:
 *
 * on-open    defines an expression to evaluate whenever the menu opens
 * on-close   defines an expression to evaluate whenever the menu closes
 * ng-mouseup defines an expression to evaluate when a menu item is selected
 *
 * Example usage:
 *
 * <div ry-menu on-open="doSomethingWhenMenuOpens()" on-close="varSetOnClose = varValue">
 *   <span ry-menu-trigger>Click here to open menu</span>
 *   <ul ry-menu-list>
 *     <li ry-menu-item ng-repeat="item in items" ng-mouseup="doSomethingWhenItemSelected()">{{item}}</li>
 *   </ul>
 * </div>
 *
 * Extending ry-menu:
 *
 * Since these directives are applied to plain HTML elements, you can supplement
 * ry-menu behavior with your own. See the example 'Extending ry-menu' on the demo page.
 *
 */

/**
 * Search for a specified attribute on an element and its ancestors.
 * Once found, return the element. If not found, return null.
 * Note: Element.hasAttribute not supported < IE9.
 *
 * @param {Element} element The element from which to start searching
 * @param {String} attribute The attribute for which to search
 * @return {Element | null} The element with the attribute
 */
function findElementWithAttribute(element, attribute) {
  while (element) {
    if ( element.hasAttribute && element.hasAttribute(attribute) ) {
      return element;
    }
    element = element.parentNode;
  }
  return null;
}

angular.module('ryMenuDemo', [])
.directive('ryMenu', ['$document', '$parse', function($document, $parse) {
  return {
    restrict: 'A',
    require: 'ryMenu',//require own controller
    scope: true,
    controller: function($scope) {
      $scope.isOpen = false;
      this.open = function open() {
        $scope.isOpen = true;
        $scope.onOpen($scope);
      };
      this.close = function close() {
        $scope.isOpen = false;
        $scope.onClose($scope);
      };
    },
    link: function(scope, element, attributes, ryMenuCtrl) {
      var domElement = element[0];

      //if attribute is undefined, $parse returns angular.noop
      scope.onOpen = $parse(attributes.onOpen);
      scope.onClose = $parse(attributes.onClose);
      //mousedown anywhere to close menu
      function closeFromAnywhere(event) {
        if (!scope.isOpen) {
          return;
        }
        //close menu if event came from anywhere except inside this menu
        var enclosingMenu = findElementWithAttribute(event.target, 'ry-menu');
        if (enclosingMenu !== domElement) {
          scope.$apply(function() {
            ryMenuCtrl.close();
          });
        }
      }
      $document.on('mousedown', closeFromAnywhere);
      scope.$on('$destroy', function() {
        $document.off('mousedown', closeFromAnywhere);
      });
    }
  };
}])
.directive('ryMenuTrigger', [function() {
  return {
    restrict: 'A',
    require: '^ryMenu',//trigger and menu could be on the same element
    link: function(scope, element, attributes, ryMenuCtrl) {
      element.on('mousedown', function() {
        scope.$apply(function() {
          if (scope.isOpen) {
            ryMenuCtrl.close();
          } else {
            ryMenuCtrl.open();
          }
        });
      });
    }
  };
}])
.directive('ryMenuList', ['$animate', function($animate) {
  return {
    restrict: 'A',
    require: '^^ryMenu',
    link: function(scope, element, attributes, ryMenuCtrl) {
      element.on('mousedown', function(event) {
        event.stopPropagation();
      });
      //this was taken from ngShow
      scope.$watch('isOpen', function(isOpen) {
        //reuse ng-hide CSS machinery
        $animate[isOpen ? 'removeClass' : 'addClass'](element, 'ng-hide', {
          tempClasses: 'ng-hide-animate'
        });
      });
    }
  };
}])
.directive('ryMenuItem', function() {
  return {
    restrict: 'A',
    require: '^^ryMenu',
    link: function(scope, element, attributes, ryMenuCtrl) {
      element.on('mouseup', function() {
        scope.$apply(function() {
          ryMenuCtrl.close();
        });
      });
    }
  };
});
