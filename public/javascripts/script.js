
(function ($) {
    'use strict';

    //========================
    //== FUNCTION VARIABLES ==
    //========================
    //== Store the parsable page URI
    var pageURL = $.url();

    //======================
    //== NAVIGATION MENUS ==
    //======================
    //== Highlight the top nav menu items
    $('#top-menu a').filter(function () {
        var thisURL = $(this).url();
        return thisURL.segment(2) === pageURL.segment(2);
    }).parent().addClass('active');

    //== Highlight the sub nav menu items
    $('#profile-menu a, #about-menu a').filter(function () {
        var thisURL = $(this).url();
        return thisURL.segment(3) === pageURL.segment(3);
    }).parent().addClass('active');

    //====================
    //== PROFILE VIEWER ==
    //====================
    //== Handle changes to profile filters
    $('#profile-filters-container select').change(function (e, data) {

        //== Set selected values
        var companyVal = $('#company-filter').val().trim(),
            teamVal    = $('#team-filter').val().trim();

        //== If Company and Team selections have been made send the data request
        if (companyVal && teamVal) {
            $.ajax({
                url:  '/ti/profiles/filter',
                type: 'POST',
                data: {
                    'company':    companyVal,
                    'department': teamVal
                },
                success: function (data, textStatus, jqXHR) {
                    if (data.trim()) {
                        $('#profile-list').html(data);
                    } else {
                        $('#profile-list').html($('#invalid-filter-text').html());
                    }
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    alert(errorThrown + '. Unable to return results');
                    location.reload(true);
                }
            });
        } else {
            $('#profile-list').html($('#initial-filter-text').html());
        }
    });

    //== Handle profile click
    $(document).on('touchstart click', '.profile-item', function (e) {
        $.ajax({
            url:  '/ti/profiles/detail',
            type: 'POST',
            data: {
                'profileID': this.id
            },
            success: function (data, textStatus, jqXHR) {
                if (data.trim()) {
                    $('#modal-content').html(data);
                    $('.modal').modal({
                        fadeDuration: 250
                    });
                } else {
                    alert('Failed to grab profile detail');
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert(errorThrown);
            }
        });
    });

    $(function () {
        //== Trigger selection on ready. It will automatically select the logged in values, or display instructional text
        $('#company-filter').trigger('change', [{ initial: true }]);
    });

    //====================
    //== SUMMARY REPORT ==
    //====================
    //== Handle changes to profile filters
    $('#summary-filters-container select').change(function (e, data) {

        //== Set selected values
        var companyVal = $('#company-filter').val().trim(),
            teamVal    = $('#team-filter').val().trim();

        //== If Company and Team selections have been made send the data request
        if (companyVal && teamVal) {
            $.ajax({
                url:  '/ti/summary/filter',
                type: 'POST',
                data: {
                    'company':    companyVal,
                    'department': teamVal
                },
                success: function (data, textStatus, jqXHR) {
                    if (data.trim()) {
                        $('#summary-content').html(data);
                        var settings = {
                            'size': {
                                'grid': 8,
                                'normalize': false
                            },
                            'options': {
                                'color':          'random-dark',
                                'printMultiplier': 1,
                                'sort':           'highest'
                            },
                            'font':  'Futura, Helvetica, sans-serif',
                            'shape': 'square'
                        };
                        $('#summary-wordcloud').awesomeCloud(settings);
                    } else {
                        $('#summary-content').html($('#invalid-filter-text').html());
                    }
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    alert(errorThrown + '. Unable to return results');
                    location.reload(true);
                }
            });
        } else {
            $('#summary-content').html($('#initial-filter-text').html());
        }
    });

    //==================
    //== ABOUT (HELP) ==
    //==================
    //== Handle the activation of the accordion list
    function enableAccordion(container, headerTag, active, callback) {
        $(container).accordion({
            event:       'click',
            header:       headerTag,
            heightStyle: 'content',
            collapsible:  true,
            active:       active,
            // Intercept the events to allow more than one pane to be open at a time
            beforeActivate: function (event, ui) {
                var currHeader,
                    currContent,
                    isPanelSelected;
                if (ui.newHeader[0]) {
                    currHeader  = ui.newHeader;
                    currContent = currHeader.next('.ui-accordion-content');
                } else {
                    currHeader  = ui.oldHeader;
                    currContent = currHeader.next('.ui-accordion-content');
                }
                isPanelSelected = currHeader.attr('aria-selected') === 'true';

                currHeader.toggleClass('ui-corner-all', isPanelSelected).toggleClass('accordion-header-active ui-state-active ui-corner-top', !isPanelSelected).attr('aria-selected', ((!isPanelSelected).toString()));

                currHeader.children('.ui-icon').toggleClass('ui-icon-triangle-1-e', isPanelSelected).toggleClass('ui-icon-triangle-1-s', !isPanelSelected);

                currContent.toggleClass('accordion-content-active', !isPanelSelected);
                if (isPanelSelected) {
                    currContent.slideUp();
                } else {
                    currContent.slideDown();
                }

                return false;
            }
        });
        //== Execute the callback
        if (callback && typeof callback === 'function') {
            callback();
        }
    }

    //== Enable to expandable accordion list
    $('#about-accordion-enable').on('touchstart click', function () {
        enableAccordion('.ui-accordion-top', 'h3', false);
        enableAccordion('.ui-accordion-sub', 'h4', false);
        $('#about-accordion-enable').slideToggle('fast', function () {
            $('#about-accordion-disable').slideToggle('fast');
        });
    });

    //== Disable the expandable accordion list
    $('#about-accordion-disable').on('touchstart click', function () {
        $('.ui-accordion-sub').accordion('destroy');
        $('.ui-accordion-top').accordion('destroy');
        $('#about-accordion-disable').slideToggle('fast', function () {
            $('#about-accordion-enable').slideToggle('fast');
        });
    });

    $(function () {
        //== Determine the accordion active state
        var activeIndex = $('.ui-accordion-top > div').index($('div.active')),
            active;
        if (activeIndex === -1) {
            active = false;
        } else {
            active = activeIndex;
        }
        //== Enable accordion on ready
        enableAccordion('.ui-accordion-top', 'h3', active);
        enableAccordion('.ui-accordion-sub', 'h4', false, function () {
            //== Show help text
            $('#about-main-text').fadeIn('slow');
        });
    });

    //==============================
    //== PROFILE HOME - STRENGTHS ==
    //==============================
    //== Update strength tags
    function updateTag(tag, id, action) {
        if (tag && id && action) {
            $.ajax({
                url:  '/ti/profiles/strengths',
                type: 'PUT',
                data: {
                    'tag':    tag,
                    'type':   id.charAt(5).toUpperCase() + id.substring(6),
                    'action': action
                },
                success: function (data, textStatus, jqXHR) {
                    //alert(data);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    alert(errorThrown + '. Tag not updated');
                    location.reload(true);
                }
            });
        }
    }

    $(function () {
        //== If page has a tag box
        if ($('#tag-box-container').length) {
            //== Define tags input options
            var tagOptions = {
                    'width':              '100%',
                    'height':             '100px',
                    'defaultText':        'Add...',
                    'removeWithBackspace': false,
                    'maxChars':            20,
                    'onAddTag':            updateTag,
                    'onRemoveTag':         updateTag
                };
            //== Initialize the tag boxes
            $('#tags-team').tagsInput(tagOptions);
            $('#tags-company').tagsInput(tagOptions);
            $('#tags-other').tagsInput(tagOptions);
            //== Show the tag inputs
            $('#tag-box-container').fadeIn('slow');
        }
    });

    //================================
    //== PROFILE HOME - PREFERENCES ==
    //================================
    //== Update <select> group to control/cascade the availability of the <select> elements
    function cascadeSelectAvailability(selectClass, nonCascadeVal) {
        var selectID   = selectClass.replace('.', '#'),
            classSize  = $('select' + selectClass).length,
            selectNum  = '',
            nSelectNum = 0,
            loopNum    = 0,
            keepLoop   = true;
        //== If first selection is No Preference then disable other <select>s
        if ($(selectID + '-1 option:selected').text() === nonCascadeVal) {
            $(selectClass + ':not(' + selectID + '-1)').val('');
            $(selectClass + ':not(' + selectID + '-1)').prop('disabled', true);
        } else {
        //== Otherwise cascade the availability
            $('select' + selectClass).each(function (i, select) {
                selectNum  = select.id.split('-').pop();
                nSelectNum = Number(selectNum);
                //== If <select> is NOT blank then enable the next <select>
                if ($(selectID + '-' + selectNum).val() !== '') {
                    $(selectID + '-' + (nSelectNum + 1).toString()).prop('disabled', false);
                } else {
                //== If <select> is blank then disable the <select>s that follow it
                    for (loopNum = Number(selectNum) + 1; loopNum <= classSize; loopNum += 1) {
                        $(selectID + '-' + loopNum.toString()).val('');
                        $(selectID + '-' + loopNum.toString()).prop('disabled', true);
                    }
                    //== Stop looping <select>s if we found a blank
                    keepLoop = false;
                }
                return keepLoop;
            });
        }
    }

    //== Update <select> group to keep options mutually exclusive
    function mutuallyExclusiveSelects(selectClass, nonCascadeVal) {
        var excludeVals  = [],
            selectedVal  = '',
            selectedText = '';
        //== Catalog the selected values in the group
        $(selectClass).each(function () {
            selectedVal  = $(this).val();
            selectedText = $(this).text();
            if (selectedVal && selectedText !== nonCascadeVal) {
                excludeVals.push({ 'selectID': '.' + $(this).id, 'selectVal': $(this).val() });
            }
        });
        //== Show everything
        $(selectClass + ' option').show(0);
        //== Hide the selected values from the catalog
        excludeVals.forEach(function (exclude) {
            $(selectClass + ':not(' + exclude.selectID + ') option[value="' + exclude.selectVal + '"]').hide(0);
        });
        //== Then cascade the element availability
        cascadeSelectAvailability(selectClass, nonCascadeVal);
    }

    //== Update preferences in DB
    function updatePrefs(prefType, typeCategory, choiceNum, choiceValue, nonCascadeVal) {
        $.ajax({
            url: '/ti/profiles/preferences',
            type: 'PUT',
            data: {
                'prefType':     prefType,
                'typeCategory': typeCategory,
                'choiceNum':    choiceNum,
                'choiceValue':  choiceValue
            },
            success: function (data, textStatus, jqXHR) {
                //== <select> class shall be returned
                //== Now enforce <select> options mutual exclusivity and cascade <select> availability
                mutuallyExclusiveSelects(data, nonCascadeVal);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert(errorThrown + ': Preferences not updated');
                location.reload(true);
            }
        });
    }

    //== Handle changes to Contact choices
    $('select.contact-preferences').change(function (e, data) {
        //== Identify the elements
        var prefType      = this.id.split('-').shift(),
            typeCategory  = this.id.split('-')[1],
            choiceClass   = '.' + prefType + '-' + typeCategory,
            choiceNum     = '',
            choiceValue   = '',
            nonCascadeVal = 'No Preference';

        //== If not initial page load trigger then update DB
        if (!data) {
            //== Set the values for the update
            choiceNum   = this.id.split('-').pop();
            choiceValue = this.value;
            //== If values are valid then perform the DB update
            if (choiceNum) {
                updatePrefs(prefType, typeCategory, choiceNum, choiceValue, nonCascadeVal);
            }
        } else {
            //== Remove No Preference option from all but first <select>
            $(choiceClass + ':not(' + choiceClass.replace('.', '#') + '-1) option:contains("' + nonCascadeVal + '")').remove();
            //== Trigger the mutually exclusive and cascade functionality
            mutuallyExclusiveSelects(choiceClass, nonCascadeVal);
        }
    });

    //== Handle changes to meeting preferences
    $('select.meeting-preferences').change(function (e, data) {
        //== Identify the elements
        var id           = this.id,
            prefType     = id.split('-').shift(),
            typeCategory = (function () {
                var className = '',
                    i         = 0,
                    idArr     = id.split('-');
                idArr.shift();
                for (i = 0; i < idArr.length; i += 1) {
                    if (i === 0) {
                        className = idArr[i];
                    } else {
                        className += '-' + idArr[i];
                    }
                }
                return className;
            })(),
            choiceValue = this.value;

        //== If choice value exists then call the async updater
        if (choiceValue && choiceValue !== '') {
            updatePrefs(prefType, typeCategory, 1, choiceValue);
        } else {
            location.reload(true);
        }
    });

    //== Reveal update button for changed Time preferences
    $('.time-update').keyup(function () {
        var btnId = '#' + this.id + '-btn';
        if (!$(btnId).is(':visible') && this.value.trim() !== '') {
            $(btnId).css('visibility', 'visible').hide().fadeIn().removeClass('hidden');
        } else {
            if (this.value === '') {
                $(btnId).hide('fast');
            }
        }
    });

    //== Handle changes to Time preferences
    $('.time-preference-update').click(function (e, data) {
        var idArr        = this.id.split('-'),
            inputId      = '',
            i            = 0,
            prefType,
            typeCategory,
            choiceValue;
        idArr.pop();
        for (i = 0; i < idArr.length; i += 1) {
            if (i === 0) {
                inputId = '#' + idArr[i];
            } else {
                inputId += '-' + idArr[i];
            }
        }
        prefType     = idArr.shift();
        typeCategory = idArr.pop();
        choiceValue  = $(inputId).val();
        if (choiceValue && choiceValue !== '') {
            //== Call the async updater
            updatePrefs(prefType, typeCategory, 1, choiceValue);
            $('#' + this.id).hide('fast');
        } else {
            location.reload(true);
        }
    });

    $(function () {
        //== Trigger selection availability on load - 1 item from each list
        $('#contact-help-1').trigger('change', [{ initial: true}]);
        $('#contact-announcements-1').trigger('change', [{ initial: true}]);
        $('#contact-brainstorm-1').trigger('change', [{ initial: true}]);
    });

    //================================
    //== APPLICATION ADMINISTRATION ==
    //================================
    //== Update changes in the DB
    function updateAdmin(action, updateType, value, id) {
        $.ajax({
            url:  '/ti/profiles/administrator',
            type: 'PUT',
            data: {
                'action':     action,
                'updateType': updateType,
                'value':      value,
                'id':         id
            },
            success: function (data, textStatus, jqXHR) {
                if (updateType === 'user' && action === 'Reset') {
                    //== For password resets, clear the input and populate the server message
                    $('#pw-reset-' + id).val('');
                    if (data !== 'success') {
                        $('#admin-reset-error').text(data);
                    } else {
                        $('#admin-reset-success').text('Password successfully reset!');
                    }
                } else {
                    //== For everything else, display any alerts and reload the page
                    if (data !== 'success') {
                        alert(data);
                    }
                    location.reload(true);
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert('SERVER ERROR. DB not updated');
                location.reload(true);
            }
        });
    }

    //== Handle new list values
    $('button.admin-update').click(function () {
        var i             = 0,
            //== Determine the type of list
            updateTypeArr = this.id.split('-'),
            updateType,
            //== Determine which input field to read
            input         = '#' + this.id.replace('btn', 'input'),
            value         = $(input).val();
        updateTypeArr.shift();
        updateTypeArr.pop();
        for (i = 0; i < updateTypeArr.length; i += 1) {
            if (i === 0) {
                updateType = updateTypeArr[i];
            } else {
                updateType += '-' + updateTypeArr[i];
            }
        }
        if (value.trim() !== '') {
            //== Call the async updater
            updateAdmin('Add', updateType, value);
        }
    });

    //== Handle deleted list values
    $('.admin-delete').click(function () {
        var updateTypeArr = this.id.split('-'),
            value         = updateTypeArr.pop(),
            updateType,
            i             = 0;
        updateTypeArr.pop();
        for (i = 0; i < updateTypeArr.length; i += 1) {
            if (i === 0) {
                updateType = updateTypeArr[i];
            } else {
                updateType += '-' + updateTypeArr[i];
            }
        }
        //== Call the async updater
        updateAdmin('Remove', updateType, value);
    });

    //== Handle user detail view
    $(document).on('touchstart click', '.admin-user', function (e) {
        $.ajax({
            url:  '/ti/profiles/administrator/user',
            type: 'POST',
            data: {
                'profileID': this.id.split('-').pop()
            },
            success: function (data, textStatus, jqXHR) {
                if (data.trim()) {
                    $('#modal-content').html(data);
                    $('.modal').modal({
                        fadeDuration: 250
                    });
                } else {
                    alert('Failed to grab user detail');
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert(errorThrown);
            }
        });
    });

    //== Handle password reset start
    $(document).on('touchstart click', 'button.admin-reset', function (e) {
        $('button.admin-reset').prop('disabled', true);
        $('#admin-reset-user').show('slide', { direction: 'left' }, 500);
    });

    //== Handle password reset cancel
    $(document).on('touchstart click', 'button.admin-reset-cancel', function (e) {
        $('#admin-reset-user').hide('slide', { direction: 'left' }, 500);
        $('#admin-reset-user input').val('');
        $('button.admin-reset').prop('disabled', false);
    });

    //== Handle password reset confirm
    $(document).on('touchstart click', 'button.admin-reset-confirm', function (e) {
        var id         = this.id.split('-').pop(),
            updateType = 'user',
            value      = $('#pw-reset-' + id).val();
        //== Call the async updater
        if (updateType && id && value) {
            /*alert('Reset, updateType: ' + updateType + ', user: ' + id + ', new password: ' + value);*/
            updateAdmin('Reset', updateType, value, id);
        } else {
            alert('Invalid password');
        }
    });

    //== Handle user remove start
    $(document).on('touchstart click', 'button.admin-remove', function (e) {
        $('button.admin-remove').prop('disabled', true);
        $('#admin-remove-user').show('slide', { direction: 'up' }, 500);
    });

    //== Handle user remove cancel
    $(document).on('touchstart click', 'button.admin-remove-cancel', function (e) {
        $('#admin-remove-user').hide('slide', { direction: 'up' }, 500);
        $('button.admin-remove').prop('disabled', false);
    });

    //== Handle user remove confirm
    $(document).on('touchstart click', 'button.admin-remove-confirm', function (e) {
        var id         = this.id.split('-').pop(),
            updateType = 'user',
            value      = '';
        //== Call the async updater
        if (updateType && id) {
            /*alert('Remove, updateType: ' + updateType + ', user: ' + id);*/
            updateAdmin('Remove', updateType, value, id);
        } else {
            alert('Could not determine the user ID');
        }
    });

})(jQuery);