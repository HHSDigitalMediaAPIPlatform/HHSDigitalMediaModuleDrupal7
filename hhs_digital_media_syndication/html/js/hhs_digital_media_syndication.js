/**
 * @file
 * Javascript used by HHS Digital Media Syndication Module.
 */

var CDCContentSynd = function() {
  "use strict";

  var sourceData = [
  {
    "label" : "Please Select Source",
      "value" : "",
      "topicsUrl" : "",
      "mediaTypesUrl" : "",
      "mediaByTopicsUrl" : "",
      "mediaByTopicsUrlTopicsDelim" : "",
      "mediaUrl" : "",
      "mediaUrlHttps" : "",
      "urlContainsUrl" : ""
  },
  {
    "label" : "CDC",
    "value" : "CDC",
    "topicsUrl" : "http://t.cdc.gov/api/v2/resources/topics.jsonp?showchild=true&max=0",
    "mediaTypesUrl" : "http://t.cdc.gov/api/v2/resources/mediatypes?max=0",
    "mediaByTopicsUrl" : "http://t.cdc.gov/api/v2/resources/media?topicid={topicids}&mediatype={mediatype}&sort=-dateModified&max=0",
    "mediaByTopicsUrlAllTypes" : "http://t.cdc.gov/api/v2/resources/media?topicid={topicids}&&sort=-dateModified&max=0",
    "mediaUrl" : "http://t.cdc.gov/api/v2/resources/media/{mediaid}/syndicate",
    "mediaUrlHttps" : "https://tools.cdc.gov/api/v2/resources/media/{mediaid}/syndicate",
    "urlContainsUrl" : "http://t.cdc.gov/api/v2/resources/media?sourceUrlContains={urlcontains}&fields=id,sourceUrl&max=30"
  }
  ];

  var previewMediaId = '';
  var selectedSourceData = new Object();

  var scriptPath = '';
  jQuery('script').each(function() {
    var src = jQuery(this).attr('src');
    if (src && src.indexOf('hhs_digital_media_syndication.js') >= 0) {
      scriptPath = src.replace(/hhs_digital_media_syndication\.js.*?$/, '');
      return false;
    }
  });

  var init = function() {
    // Set source data here.
    var selectedSource = jQuery('input[name="cdccs_sourceval"]').val();
    for (var i = 0; i < sourceData.length; i++) {
      if (sourceData[i].value === selectedSource) {
        jQuery('select[name="cdccs_source"]')
          .append(jQuery("<option></option>")
              .attr("value", sourceData[i].value)
              .text(sourceData[i].label)
              .attr("selected", true));
      }
      else {
        jQuery('select[name="cdccs_source"]')
          .append(jQuery("<option></option>")
              .attr("value", sourceData[i].value)
              .text(sourceData[i].label));
      }
    }

    jQuery('input[name="cdccs_fromdate"]').mask("99/99/9999",{placeholder:" "});
    jQuery('select[name="cdccs_source"]').change(handleSourceChange);
    jQuery('select[name="cdccs_title"]').change(handleTitleChange);
    jQuery('input[name="cdccs_fromdate"]').change(handleFromDateChange);
    jQuery('select[name="cdccs_mediatypes[]"]').change(handleMediaTypesChange);
    jQuery('input[name="cdccs_stripimages"]').change(handleDisplayOptionChange);
    jQuery('input[name="cdccs_stripanchors"]').change(handleDisplayOptionChange);
    jQuery('input[name="cdccs_stripcomments"]').change(handleDisplayOptionChange);
    jQuery('input[name="cdccs_stripinlinestyles"]').change(handleDisplayOptionChange);
    jQuery('input[name="cdccs_stripscripts"]').change(handleDisplayOptionChange);
    jQuery('select[name="cdccs_encoding"]').change(handleDisplayOptionChange);
    jQuery('input[name="cdccs_stripbreaks"]').change(handleDisplayOptionChange);
    jQuery('select[name="cdccs_imagefloat"]').change(handleDisplayOptionChange);
    jQuery('input[name="cdccs_cssclasses"]').change(handleDisplayOptionChange);
    jQuery('input[name="cdccs_ids"]').change(handleDisplayOptionChange);
    jQuery('input[name="cdccs_xpath"]').change(handleDisplayOptionChange);
    jQuery('input[name="cdccs_namespace"]').change(handleDisplayOptionChange);
    jQuery('input[name="cdccs_linkssamewindow"]').change(handleDisplayOptionChange);
    jQuery('input[name="cdccs_width"]').change(handleDisplayOptionChange);
    jQuery('input[name="cdccs_height"]').change(handleDisplayOptionChange);
    jQuery('input[name="cdccs_https"]').change(handleDisplayOptionChange);
    jQuery('input[name="cdccs_searchtype"]').change(handleSearchTypeChange);
    // To kick off loading of all fields based on previous saved settings.
    handleSourceChange();
    initUrlSearchField();
    if (isUrlSearchType()) {
      handleSearchTypeChange();
    }
  };

  var topicsCallback = function (response) {
    if (!response || !response.results || response.results.length < 1) {
      jQuery('div[id="cdccs_topictree_control"]').html("<p>There was a problem loading topics, please refresh and try again</p>");
      previewError();
      return;
    }

    var selectedTreeNodes = jQuery('input[name="cdccs_topictree"]').val().split(",");
    var jstreeData = processResultLevel(response.results, selectedTreeNodes, new Array());
    loadingTopics(false);
    jQuery('div[id="cdccs_topictree_control"]').on('changed.jstree', handleTreeChanged);
    jQuery('div[id="cdccs_topictree_control"]').jstree(
        {
          "core" : {
            "data" : jstreeData
          },
      "checkbox" : {
        "three_state" : false
      },
      "plugins" : ["checkbox"]
        });
  };

  var mediaTypesCallback = function (response) {
    var mediaTypesSelect = jQuery('select[name="cdccs_mediatypes[]"]');

    mediaTypesSelect.prop('disabled', false);
    mediaTypesSelect.find('option').remove();
    mediaTypesSelect.append(jQuery("<option></option>")
        .attr("value", "")
        .text("All Media Types"));

    if (!response || !response.results) {
      var mediaTypeSelect = jQuery('input[name="cdccs_mediatypesval"]');
      mediaTypeSelect.val("");
      return;
    }
    // Set selected media types.
    var selectedMediaTypes = jQuery('input[name="cdccs_mediatypesval"]').val().split(",");

    for (var i = 0; i < response.results.length; i++) {
      if (jQuery.inArray(response.results[i].name, selectedMediaTypes) > -1) {
        mediaTypesSelect.append(jQuery("<option></option>")
            .attr("value", response.results[i].name)
            .text(response.results[i].name)
            .attr("selected", true));
      }
      else {
        mediaTypesSelect.append(jQuery("<option></option>")
            .attr("value", response.results[i].name)
            .text(response.results[i].name));
      }
    }
  };

  var mediaTitleCallback = function (response) {
    jQuery('select[name="cdccs_title"]').prop('disabled', false);
    if (!response || !response.results) {
      return;
    }
    var titleSelect = jQuery('select[name="cdccs_title"]');
    var titleHiddenField = jQuery('input[name="cdccs_titleval"]');

    titleSelect.find('option').remove();

    // Since CDC API doesn't (yet) support filtering by date, sort by date and then only show items with mod date >= from date.
    if (selectedSourceData.value === 'CDC') {
      var fromDate = new Date(jQuery('input[name="cdccs_fromdate"]').val());
    }

    var foundSelectedTitle = false;
    titleSelect.append(jQuery("<option></option>")
        .attr("value", "")
        .text("Select Title"));
    for (var i = 0; i < response.results.length; i++) {
      var titleSelect = jQuery('select[name="cdccs_title"]');

      if (selectedSourceData.value === 'CDC' && fromDate) {
        var thisLastModDate = parseFromDate(response.results[i].dateModified);
        if (thisLastModDate < fromDate) {
          continue;
        }
      }

      if (response.results[i].id == titleHiddenField.val()) {
        titleSelect.append(jQuery("<option></option>")
            .attr("value", response.results[i].id)
            .text(response.results[i].name)
            .attr('selected', true));
        foundSelectedTitle = true;
      }
      else {
        titleSelect.append(jQuery("<option></option>")
            .attr("value", response.results[i].id)
            .text(response.results[i].name));
      }

    }

    if (foundSelectedTitle) {
      handleTitleChange();
    }
    else {
      titleHiddenField.val("");
      clearPreview();
    }

    if (titleSelect.find('option').length < 1) {
      noTitlesFound();
    }
  };

  var mediaCallback = function (response) {
    if (!response || !response.results) {
      previewError();
    }
    loadingPreview(false);
    jQuery('div[id="cdccs_preview_div"]').html(response.results.content);
  };

  var handleSourceChange = function () {
    var selectedSource = jQuery('select[name="cdccs_source"] option:selected').val();
    if (selectedSource === "") {
      resetForm();
      return;
    }

    jQuery('select[name="cdccs_mediatypes[]"]').prop('disabled', true);
    loadingTopics(true);
    jQuery('input[name="cdccs_sourceval"]').val(selectedSource);
    var topicsUrl = "";
    var mediaTypesUrl = "";
    if (sourceData) {
      for (var i = 0; i < sourceData.length; i++) {
        if (selectedSource === sourceData[i].value) {
          topicsUrl = sourceData[i].topicsUrl;
          mediaTypesUrl = sourceData[i].mediaTypesUrl;
          selectedSourceData = sourceData[i];
          break;
        }
      }
    }
    jQuery.ajaxSetup({cache:false});
    jQuery.ajax({
      url: topicsUrl,
      dataType: "jsonp",
      success: topicsCallback,
      error: function(xhr, ajaxOptions, thrownError) {
        jQuery('div[id="cdccs_topictree_control"]').html("<p>There was a problem loading topics, please refresh and try again</p>");
      }
    });

    jQuery.ajax({
      url: mediaTypesUrl,
      dataType: "jsonp",
      success: mediaTypesCallback,
      error: function(xhr, ajaxOptions, thrownError) {
        jQuery('select[name="cdccs_mediatypes[]"]').prop('disabled', false);
      }
    });
  };

  var handleFromDateChange = function () {
    loadTitles();
  };

  var handleMediaTypesChange = function () {
    var selectedMediaTypes = jQuery('select[name="cdccs_mediatypes[]"]').val();
    if (selectedMediaTypes) {
      jQuery('input[name="cdccs_mediatypesval"]').val(selectedMediaTypes.join());
    }
    else {
      jQuery('input[name="cdccs_mediatypesval"]').val("");
    }
    loadTitles();
  };

  var handleTreeChanged = function (e, data) {
    var topicTreeControl = jQuery('div[id="cdccs_topictree_control"]').jstree(true);
    if (topicTreeControl && !!topicTreeControl.get_selected) {
      var selectedNodes = topicTreeControl.get_selected();
      if (selectedNodes && selectedNodes.length > 0) {
        jQuery('input[name="cdccs_topictree"]').val(selectedNodes.join(","));
      }
      else {
        jQuery('input[name="cdccs_topictree"]').val("");
      }
    }
    loadTitles();
  };

  var handleTitleChange = function () {
    var mediaId = jQuery('select[name="cdccs_title"] option:selected').val();
    jQuery('input[name="cdccs_titleval"]').val(mediaId);
    if (mediaId === "") {
      clearPreview();
      return;
    }
    if (isMetadataSearchType()) {
      loadPreviewForMediaId(mediaId);
    }
  };

  var getConfigureParamsAsQueryString = function () {
    var queryString = "";
    var delim = "";
    if (jQuery('input[name="cdccs_stripimages"]').prop('checked')) {
      queryString += delim + "stripImages=true";
      delim = "&";
    }
    if (jQuery('input[name="cdccs_stripscripts"]').prop('checked')) {
      queryString += delim + "stripScripts=true";
      delim = "&";
    }
    if (jQuery('input[name="cdccs_stripanchors"]').prop('checked')) {
      queryString += delim + "stripAnchors=true";
      delim = "&";
    }
    if (jQuery('input[name="cdccs_stripcomments"]').prop('checked')) {
      queryString += delim + "stripComments=true";
      delim = "&";
    }
    if (jQuery('input[name="cdccs_stripinlinestyles"]').prop('checked')) {
      queryString += delim + "stripStyles=true";
      delim = "&";
    }
    var encoding = jQuery('select[name="cdccs_encoding"] option:selected').val();
    if (encoding) {
      queryString += delim + "oe=" + encoding;
      delim = "&";
    }
    if (jQuery('input[name="cdccs_stripbreaks"]').prop('checked')) {
      queryString += delim + "stripBreaks=true";
      delim = "&";
    }
    var imageFloat = jQuery('select[name="cdccs_imagefloat"] option:selected').val();
    if (imageFloat) {
      queryString += delim + "imageFloat=" + imageFloat;
      delim = "&";
    }
    var cssClasses = jQuery('input[name="cdccs_cssclasses"]').val();
    if (cssClasses !== '') {
      queryString += delim + "cssClasses=" + cssClasses;
      delim = "&";
    }
    var elementIds = jQuery('input[name="cdccs_ids"]').val();
    if (elementIds !== '') {
      queryString += delim + "ids=" + elementIds;
      delim = "&";
    }
    var xpath = jQuery('input[name="cdccs_xpath"]').val();
    if (xpath !== '') {
      queryString += delim + "xpath=" + xpath;
      delim = "&";
    }
    var namespace = jQuery('input[name="cdccs_namespace"]').val();
    if (namespace !== '') {
      queryString += delim + "ns=" + namespace;
      delim = "&";
    }
    if (jQuery('input[name="cdccs_linkssamewindow"]').prop('checked')) {
      queryString += delim + "nw=false";
      delim = "&";
    }
    var width = jQuery('input[name="cdccs_width"]').val();
    if (width !== '') {
      queryString += delim + "w=" + width;
      delim = "&";
    }
    var height = jQuery('input[name="cdccs_height"]').val();
    if (height !== '') {
      queryString += delim + "h=" + height;
      delim = "&";
    }
    return queryString;
  };

  var noTitlesFound = function () {
    var titleSelect = jQuery('select[name="cdccs_title"]');
    titleSelect.append(jQuery("<option></option>")
        .attr("value", "")
        .text("No Titles Found"));
  };

  var loadTitles = function () {
    var mediaUrl = selectedSourceData.mediaByTopicsUrl;
    var selectedNodes = jQuery('input[name="cdccs_topictree"]').val().split(",");
    if (!selectedNodes || (selectedNodes.length == 1 && selectedNodes[0] === "")) {
      jQuery('select[name="cdccs_title"]').find('option').remove();
      jQuery('input[name="cdccs_titleval"]').val("");
      clearPreview();
      noTitlesFound();
      return;
    }

    var selectedTopicIds = getSelectedTopicIdsFromTreeNodes(selectedNodes);

    jQuery('select[name="cdccs_title"]').prop("disabled", true);
    var delim = ",";
    if (selectedSourceData.mediaByTopicsUrlTopicsDelim) {
      delim = selectedSourceData.mediaByTopicsUrlTopicsDelim;
    }

    // TODO: Replace {fromdate} in url with the selected from date.
    // Need API that supports this first (CDC does not yet).
    var fromDate = jQuery('input[name="cdccs_fromdate"]').val();

    var mediaTypes = "";
    var selectedMediaTypes = jQuery('select[name="cdccs_mediatypes[]"]').val();
    if (selectedMediaTypes) {
      mediaTypes = selectedMediaTypes.join();
    }
    if (mediaTypes === '') {
      mediaUrl = selectedSourceData.mediaByTopicsUrlAllTypes;
    }
    else {
      mediaUrl = mediaUrl.replace("{mediatype}", mediaTypes);
    }

    mediaUrl = mediaUrl.replace("{topicids}", selectedTopicIds.join(delim));

    jQuery.ajaxSetup({cache:false});
    jQuery.ajax({
      url: mediaUrl,
      dataType: "jsonp",
      success: mediaTitleCallback,
      error: function(xhr, ajaxOptions, thrownError) {
        jQuery('select[name="cdccs_title"]').prop('disabled', false);
      }
    });
  };

  var resetForm = function () {
    jQuery('input[name="cdccs_sourceval"]').val("");
    jQuery('input[name="cdccs_fromdate"]').val("");
    var topictree = jQuery('div[id="cdccs_topictree_control"]');
    if (topictree && !!topictree.jstree(true).destroy) {
      topictree.jstree(true).destroy();
    }
    jQuery('div[id="cdccs_topictree_control"]').html("");
    jQuery('input[name="cdccs_topictree"]').val("");
    var titleSelect = jQuery('select[name="cdccs_title"]');
    titleSelect.find('option').remove();
    var mediaTitleSelect = jQuery('select[name="cdccs_mediatypes[]"]');
    mediaTitleSelect.find('option').remove();
    jQuery('input[name="cdccs_mediatypesval"]').val("");
    jQuery('input[name="cdccs_titleval"]').val("");
    clearPreview();
  };

  var parseFromDate = function (fromDate) {
    var parts = fromDate.match(/(\d+)-(\d+)-(\d+)T(\d+):(\d+):(\d+)Z/);
    return new Date('' + parts[1], parts[2] - 1, + parts[3], + parts[4], + parts[5], + parts[6]);
  };

  var htmlDecode = function (value) {
    if (value) {
      return jQuery('<div />').html(value).text();
    } else {
      return '';
    }
  };

  var getSelectedTopicIdsFromTreeNodes = function (selectedNodes) {
    var selectedTopicIds = new Array();
    for(var i = 0; i < selectedNodes.length; i++) {
      var nodeIdElements = selectedNodes[i].split("_");
      selectedTopicIds.push(nodeIdElements.pop());
    }
    return selectedTopicIds;
  };

  var processResultLevel = function (items, selectedItems, nodeIdHierarchy) {
    var jstreeData = [];
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (item.mediaUsageCount == 0) {
        continue;
      }
      var treeNode = new Object();
      nodeIdHierarchy.push(item.id);
      treeNode.id = nodeIdHierarchy.join("_");
      treeNode.text = item.name;
      if (jQuery.inArray('' + treeNode.id, selectedItems) > -1) {
        treeNode.state = {"opened" : true, "selected" : true};
      }
      if (item.items && item.items.length && item.items.length > 0) {
        treeNode.children = processResultLevel(item.items, selectedItems, nodeIdHierarchy);
      }
      nodeIdHierarchy.pop();
      jstreeData.push(treeNode);
    }
    return jstreeData;
  };

  var clearPreview = function () {
    jQuery('div[id="cdccs_preview_div"]').html("");
  };

  var previewError = function () {
    jQuery('input[name="cdccs_preview"]').val("");
    jQuery('div[id="cdccs_preview_div"]')
      .html("<p>There was a problem loading the content for preview, please refresh and try again</p>");
  };

  var loadingTopics = function (showIcon) {
    if (showIcon) {
      jQuery('div[id="cdccs_topictree_control"]').html('<img src="' + scriptPath + '../css/throbber.gif"/>');
    }
    else {
      jQuery('div[id="cdccs_topictree_control"]').html('');
    }
  };

  var loadingPreview = function (showIcon) {
    if (showIcon) {
      jQuery('div[id="cdccs_preview_div"]').html('<img src="' + scriptPath + '../css/throbber.gif"/>');
    }
    else {
      jQuery('div[id="cdccs_preview_div"]').html('');
    }
  };

  //############## Start New For Version 2.0
  var initUrlSearchField = function() {
    if (isUrlSearchType()) {
      var urlMediaIdVal = jQuery('input[name="cdccs_urlmediaidval"]').val();
      if (urlMediaIdVal != '') {
        loadPreviewForMediaId(urlMediaIdVal);
      }
    }
    jQuery('input[name="cdccs_url"]').autocomplete({
      source: function (req, add) {
        //TODO: Need better method for not making ajax calls based on a number of 'too generic' urls like http:// http://www.cdc.gov, http://www, etc. Maybe some regex?
        if ('http://'.indexOf(req['term']) == 0) {
          return;
        }
        var urlContainsUrl = selectedSourceData.urlContainsUrl.replace('{urlcontains}', req['term']);

        jQuery.ajax({
          url: urlContainsUrl,
          dataType: 'jsonp',
          type: 'GET',
          success: function(response){
            var suggestions = [];
            
            if (!response || !response.results || response.results.length < 1) {
              return;
            }

            for (var i = 0; i < response.results.length; i++) {
              if (i == 25) {
                suggestions.push({label: 'Many More Results Found, Type More to Narrow Search.....', value: ''});
                break;
              }
              var result = response.results[i];
              suggestions.push({label: result.sourceUrl, value: result.id}); 
            }

            add(suggestions);

          },
          error:function(jqXHR, textStatus, errorThrown){
            if (window.console) {
              console.log('error making call to fetch media by url');
              console.log(errorThrown);
            }
          }

        });
      },
      minLength: 3,
      select: function(event, ui) {
        handleUrlSelect(event, ui);
      },
      focus: function(event, ui) {
        event.preventDefault();
      }
    }); 
  };

  var handleUrlSelect = function(event, ui) {
    event.preventDefault();
    var urlField = jQuery('input[name="cdccs_url"]');
    var mediaId = ui.item.value;
    urlField.val(ui.item.label);

    if (mediaId !== '') {
      loadPreviewForMediaId(mediaId);
      jQuery('input[name="cdccs_urlmediaidval"]').val(mediaId);
    }
    return false;
  };

  var handleDisplayOptionChange = function() {
    loadPreviewForMediaId(previewMediaId);
  }

  var loadPreviewForMediaId = function(mediaId) {
    loadingPreview(true);
    previewMediaId = mediaId;
    var mediaUrl = selectedSourceData.mediaUrl;
    if (jQuery('input[name="cdccs_https"]').prop('checked')) {
      mediaUrl = selectedSourceData.mediaUrlHttps;
    }
    mediaUrl = mediaUrl.replace("{mediaid}", mediaId);
    var configParams = getConfigureParamsAsQueryString();
    if (configParams) {
      if (mediaUrl.indexOf("?") > 0) {
        mediaUrl = mediaUrl + "&" + configParams;
      } 
      else {
        mediaUrl = mediaUrl + "?" + configParams;
      }
    }
    jQuery('input[name="cdccs_preview"]').val(mediaUrl);
    jQuery.ajaxSetup({cache:false});
    jQuery.ajax({
      url: mediaUrl,
      dataType: "jsonp",
      success: mediaCallback,
      error: function(xhr, ajaxOptions, thrownError) {
        previewError();
      }
    }); 
  }

  var isMetadataSearchType = function() {
    if (jQuery('input[name="cdccs_searchtype"]:checked').val() == '0') {
      return true;
    }
    else {
      return false;
    }
  }

  var isUrlSearchType = function() {
    if (jQuery('input[name="cdccs_searchtype"]:checked').val() == '1') {
      return true;
    }
    else {
      return false;
    }
  }

  var handleSearchTypeChange = function() {
      jQuery('fieldset[id="edit-metadata-grp"] a.fieldset-title').trigger('click');
      jQuery('fieldset[id="edit-url-grp"] a.fieldset-title').trigger('click');
      var mediaIdToLoad = '';
      if (isUrlSearchType()) {
        mediaIdToLoad = jQuery('input[name="cdccs_urlmediaidval"]').val();
      }
      else {
        mediaIdToLoad = jQuery('input[name="cdccs_titleval"]').val();
      }
      if (mediaIdToLoad != '') {
        loadPreviewForMediaId(mediaIdToLoad);
      }
  }

  //############## End New For Version 2.0
  init();
};

jQuery(document).ready(function() {
  var cdcContentSynd = new CDCContentSynd();
});
