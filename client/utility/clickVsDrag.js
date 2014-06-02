'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['jquery'], function ($) {
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	$.fn.extend({
		clickNotDrop: function clickNotDrop(fn) {
			return this.each(function () {
				var that = this;
				$(that).on('mousedown', function (e) {
					e.stopPropagation();
					$(window).one('mousemove', onMouseMove);
					$(window).one('mouseup', onMouseUp);
					function onMouseMove() {
						$(window).off('mouseup', onMouseUp);
					}
					function onMouseUp(mouseUpEvent) {
						$(window).off('mousemove', onMouseMove);
						fn.call(that, mouseUpEvent);
					}
				});
			});
		},
		mouseDragDrop: function mouseDragDrop(dragFn, dropFn) {
			return this.each(function () {
				var that = this;
				$(that).on('mousedown', function (e) {
					e.stopPropagation();
					$(window).one('mousemove', onMouseMove);
					$(window).one('mouseup', onMouseUp);
					$(that).data('mouseDragDrop-dragging', false);
					function onMouseMove(moveEvent) {
						$(that).data('mouseDragDrop-dragging', true);
						dragFn.call(that, moveEvent);
					}
					function onMouseUp(dropEvent) {
						$(window).off('mousemove', onMouseMove);
						if ($(that).data('mouseDragDrop-dragging')) {
							dropFn.call(that, dropEvent);
						}
					}
				});
			});
		},
		// TODO: these event-handler removers cast way too wide a net; make them more specific
		offClickNotDrop: function offClickNotDrop() {
			return $(this).off('mousedown');
		},
		offMouseDragDrop: function offMouseDragDrop() {
			return $(this).off('mousedown');
		}
	});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
