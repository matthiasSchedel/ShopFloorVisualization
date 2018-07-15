var _init = $.ui.dialog.prototype._init;
$.ui.dialog.prototype._init = function () {
    _init.apply(this, arguments);

    var dialogElement = this;
    var dialogId = this.uiDialogTitlebar.next().attr('id');

    this.uiDialogTitlebar.append('<a href="#" id="' + dialogId +
        '-minbutton" class="ui-dialog-titlebar-minimize ui-corner-all">' +
        '<span class="ui-icon ui-icon-minusthick"></span></a>');

    $('#dialog_window_minimized_container').append(
        '<div class="dialog_window_minimized ui-widget ui-state-default ui-corner-all" id="' +
        dialogId + '_minimized">' + this.uiDialogTitlebar.find('.ui-dialog-title').text() +
        '<span class="ui-icon ui-icon-newwin"></div>');

    $('#' + dialogId + '-minbutton').hover(function () {
        $(this).addClass('ui-state-hover')
    }, function () {
        $(this).removeClass('ui-state-hover')
    }).click(function () {
        dialogElement.close();
        $('#' + dialogId + '_minimized').show()
    });

    $('#' + dialogId + '_minimized').click(function () {
        $(this).hide();
        dialogElement.open()
    })
};
