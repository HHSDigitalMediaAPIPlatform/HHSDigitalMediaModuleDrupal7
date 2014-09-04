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
      "mediaUrl" : ""
  },
  {
    "label" : "CDC", 
    "value" : "CDC", 
    "topicsUrl" : "https://tools.cdc.gov/api/v1/resources/topics.jsonp?showchild=true&max=0", 
    "mediaTypesUrl" : "https://tools.cdc.gov/api/v1/resources/mediatypes?max=0", 
    "mediaByTopicsUrl" : "https://tools.cdc.gov/api/v1/resources/media?topicid={topicids}&mediatype={mediatype}&sort=-dateModified&max=0", 
    "mediaByTopicsUrlAllTypes" : "https://tools.cdc.gov/api/v1/resources/media?topicid={topicids}&&sort=-dateModified&max=0", 
    "mediaUrl" : "https://tools.cdc.gov/api/v1/resources/media/{mediaid}/syndicate"
  }
  ];

  var selectedSourceData = new Object();

  var scriptPath = '';
  $csjq('script').each(function() {
    var src = $csjq(this).attr('src');
    if (src.indexOf('hhs_digital_media_syndication.js') >= 0) {
      scriptPath = src.replace(/hhs_digital_media_syndication\.js.*?$/, ''); 
      return false;
    }
  });

  var init = function() {
    //Set source data here.
    var selectedSource = $csjq('input[name="cdccs_sourceval"]').val();
    for (var i = 0; i < sourceData.length; i++) {
      if (sourceData[i].value === selectedSource) {
        $csjq('select[name="cdccs_source"]')
          .append($csjq("<option></option>")
              .attr("value", sourceData[i].value)
              .text(sourceData[i].label)
              .attr("selected", true));
      }
      else {
        $csjq('select[name="cdccs_source"]')
          .append($csjq("<option></option>")
              .attr("value", sourceData[i].value)
              .text(sourceData[i].label));
      }
    }

    $csjq('input[name="cdccs_fromdate"]').mask("99/99/9999",{placeholder:" "});
    $csjq('select[name="cdccs_source"]').change(handleSourceChange);
    $csjq('select[name="cdccs_title"]').change(handleTitleChange);
    $csjq('input[name="cdccs_fromdate"]').change(handleFromDateChange);
    $csjq('select[name="cdccs_mediatypes[]"]').change(handleMediaTypesChange);
    $csjq('input[name="cdccs_stripimages"]').change(handleTitleChange);
    $csjq('input[name="cdccs_stripanchors"]').change(handleTitleChange);
    $csjq('input[name="cdccs_stripcomments"]').change(handleTitleChange);
    $csjq('input[name="cdccs_stripinlinestyles"]').change(handleTitleChange);
    $csjq('input[name="cdccs_stripscripts"]').change(handleTitleChange);
    $csjq('input[name="cdccs_hidetitle"]').change(showHideContentTitleDesc);
    $csjq('input[name="cdccs_hidedescription"]').change(showHideContentTitleDesc);
    $csjq('select[name="cdccs_encoding"]').change(handleTitleChange);

    handleSourceChange(); //To kick off loading of all fields based on previous saved settings
  };

  var topicsCallback = function (response) {
    if (!response || !response.results || response.results.length < 1) {
      $csjq('div[id="cdccs_topictree_control"]').html("<p>There was a problem loading topics, please refresh and try again</p>");
      previewError();
      return;
    }

    var selectedTreeNodes = $csjq('input[name="cdccs_topictree"]').val().split(",");
    var jstreeData = processResultLevel(response.results, selectedTreeNodes, new Array());
    loadingTopics(false);
    $csjq('div[id="cdccs_topictree_control"]').on('changed.jstree', handleTreeChanged);
    $csjq('div[id="cdccs_topictree_control"]').jstree(
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
    var mediaTypesSelect = $csjq('select[name="cdccs_mediatypes[]"]');

    mediaTypesSelect.prop('disabled', false);
    mediaTypesSelect.find('option').remove();
    mediaTypesSelect.append($csjq("<option></option>")
        .attr("value", "")
        .text("All Media Types"));

    if (!response || !response.results) {
      var mediaTypeSelect = $csjq('input[name="cdccs_mediatypesval"]');
      mediaTypeSelect.val("");
      return;
    }
    //Set selected media types
    var selectedMediaTypes = $csjq('input[name="cdccs_mediatypesval"]').val().split(",");

    for (var i = 0; i < response.results.length; i++) {
      if ($csjq.inArray(response.results[i].name, selectedMediaTypes) > -1) {
        mediaTypesSelect.append($csjq("<option></option>")
            .attr("value", response.results[i].name)
            .text(response.results[i].name)
            .attr("selected", true));
      }
      else { 
        mediaTypesSelect.append($csjq("<option></option>")
            .attr("value", response.results[i].name)
            .text(response.results[i].name));
      }
    }
  }; 

  var mediaTitleCallback = function (response) {
    $csjq('select[name="cdccs_title"]').prop('disabled', false);
    if (!response || !response.results) {
      return;
    } 
    var titleSelect = $csjq('select[name="cdccs_title"]');
    var titleHiddenField = $csjq('input[name="cdccs_titleval"]');

    titleSelect.find('option').remove();

    //Since CDC API doesn't (yet) support filtering by date, sort by date and then only show items with mod date >= from date
    if (selectedSourceData.value === 'CDC') {
      var fromDate = new Date($csjq('input[name="cdccs_fromdate"]').val());
    }

    var foundSelectedTitle = false;
    titleSelect.append($csjq("<option></option>")
        .attr("value", "")
        .text("Select Title"));
    for (var i = 0; i < response.results.length; i++) {
      var titleSelect = $csjq('select[name="cdccs_title"]');

      if (selectedSourceData.value === 'CDC' && fromDate) {
        var thisLastModDate = parseFromDate(response.results[i].dateModified);
        if (thisLastModDate < fromDate) {
          continue;
        }
      }

      if (response.results[i].mediaId === titleHiddenField.val()) {
        titleSelect.append($csjq("<option></option>")
            .attr("value", response.results[i].mediaId)
            .text(response.results[i].title)
            .attr('selected', true));
        foundSelectedTitle = true; 
      }
      else {
        titleSelect.append($csjq("<option></option>")
            .attr("value", response.results[i].mediaId)
            .text(response.results[i].title));
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
    $csjq('div[id="cdccs_preview_div"]').html(response.results.content);

    showHideContentTitleDesc();
  };

  var handleSourceChange = function () {
    var selectedSource = $csjq('select[name="cdccs_source"] option:selected').val();
    if (selectedSource === "") {
      resetForm();
      return;
    }

    $csjq('select[name="cdccs_mediatypes[]"]').prop('disabled', true);
    loadingTopics(true);
    $csjq('input[name="cdccs_sourceval"]').val(selectedSource);
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
    $csjq.ajaxSetup({cache:false});
    $csjq.ajax({
      url: topicsUrl,
      dataType: "jsonp",
      success: topicsCallback,
      error: function(xhr, ajaxOptions, thrownError) {
        $csjq('div[id="cdccs_topictree_control"]').html("<p>There was a problem loading topics, please refresh and try again</p>");
      }
    });    

    $csjq.ajax({
      url: mediaTypesUrl,
      dataType: "jsonp",
      success: mediaTypesCallback,
      error: function(xhr, ajaxOptions, thrownError) {
        $csjq('select[name="cdccs_mediatypes[]"]').prop('disabled', false);
      }
    });    
  };

  var handleFromDateChange = function () {
    loadTitles();
  };

  var handleMediaTypesChange = function () {
    var selectedMediaTypes = $csjq('select[name="cdccs_mediatypes[]"]').val();
    if (selectedMediaTypes) {
      $csjq('input[name="cdccs_mediatypesval"]').val(selectedMediaTypes.join());
    }
    else {
      $csjq('input[name="cdccs_mediatypesval"]').val("");
    }
    loadTitles();
  };

  var handleTreeChanged = function (e, data) {
    var topicTreeControl = $csjq('div[id="cdccs_topictree_control"]').jstree(true);
    if (topicTreeControl && !!topicTreeControl.get_selected) {
      var selectedNodes = topicTreeControl.get_selected();
      if (selectedNodes && selectedNodes.length > 0) {
        $csjq('input[name="cdccs_topictree"]').val(selectedNodes.join(","));
      }
      else {
        $csjq('input[name="cdccs_topictree"]').val("");
      }
    }
    loadTitles();
  };

  var handleTitleChange = function () {
    var selectedTitle = $csjq('select[name="cdccs_title"] option:selected').val();
    $csjq('input[name="cdccs_titleval"]').val(selectedTitle);
    if (selectedTitle === "") {
      clearPreview();
      return;
    }
    loadingPreview(true);
    var mediaUrl = selectedSourceData.mediaUrl;
    mediaUrl = mediaUrl.replace("{mediaid}", selectedTitle);
    var configParams = getConfigureParamsAsQueryString(); 
    if (configParams) {
      if (mediaUrl.indexOf("?") > 0) {
        mediaUrl = mediaUrl + "&" + configParams;
      } 
      else {
        mediaUrl = mediaUrl + "?" + configParams;
      }
    }
    $csjq('input[name="cdccs_preview"]').val(mediaUrl); 
    $csjq.ajaxSetup({cache:false});
    $csjq.ajax({
      url: mediaUrl,
      dataType: "jsonp",
      success: mediaCallback,
      error: function(xhr, ajaxOptions, thrownError) {
        previewError();
      }
    }); 
  };

  var getConfigureParamsAsQueryString = function () {
    var queryString = "";
    var delim = "";
    if ($csjq('input[name="cdccs_stripimages"]').prop('checked')) {
      queryString += delim + "stripImage=true";
      delim = "&";
    }
    if ($csjq('input[name="cdccs_stripscripts"]').prop('checked')) {
      queryString += delim + "stripScript=true"; 
      delim = "&";
    }
    if ($csjq('input[name="cdccs_stripanchors"]').prop('checked')) {
      queryString += delim + "stripAnchor=true";
      delim = "&";
    }
    if ($csjq('input[name="cdccs_stripcomments"]').prop('checked')) {
      queryString += delim + "stripComment=true"; 
      delim = "&";
    }
    if ($csjq('input[name="cdccs_stripinlinestyles"]').prop('checked')) {
      queryString += delim + "stripStyle=true";
      delim = "&";
    }
    var encoding = $csjq('select[name="cdccs_encoding"] option:selected').val();
    if (encoding) {
      queryString += delim + "oe=" + encoding;
      delim = "&"
    }
    return queryString;
  };

  var showHideContentTitleDesc = function () {
    var mediaId = $csjq('input[name="cdccs_titleval"]').val();
    if ($csjq('input[name="cdccs_hidetitle"]').prop('checked')) {
      $csjq('span[id="cdc_title_' + mediaId + '"]').hide();
    }
    else {
      $csjq('span[id="cdc_title_' + mediaId + '"]').show();
    }
    if ($csjq('input[name="cdccs_hidedescription"]').prop('checked')) {
      $csjq('p[id="cdc_description_' + mediaId + '"]').hide();
    }
    else {
      $csjq('p[id="cdc_description_' + mediaId + '"]').show();
    }
  };

  var noTitlesFound = function () {
    var titleSelect = $csjq('select[name="cdccs_title"]');
    titleSelect.append($csjq("<option></option>")
        .attr("value", "")
        .text("No Titles Found"));
  };

  var loadTitles = function () {
    var mediaUrl = selectedSourceData.mediaByTopicsUrl;
    var selectedNodes = $csjq('input[name="cdccs_topictree"]').val().split(",");
    if (!selectedNodes || (selectedNodes.length == 1 && selectedNodes[0] === "")) {
      $csjq('select[name="cdccs_title"]').find('option').remove();
      $csjq('input[name="cdccs_titleval"]').val("");
      clearPreview();
      noTitlesFound();
      return;
    }

    var selectedTopicIds = getSelectedTopicIdsFromTreeNodes(selectedNodes);

    $csjq('select[name="cdccs_title"]').prop("disabled", true);
    var delim = ",";
    if (selectedSourceData.mediaByTopicsUrlTopicsDelim) {
      delim = selectedSourceData.mediaByTopicsUrlTopicsDelim;
    }

    //TODO: Replace {fromdate} in url with the selected from date.  Need API that supports this first (CDC does not yet).
    var fromDate = $csjq('input[name="cdccs_fromdate"]').val();

    var mediaTypes = "";
    var selectedMediaTypes = $csjq('select[name="cdccs_mediatypes[]"]').val(); //Array of media type names selected
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
    if (mediaUrl.indexOf("?") > 0) {
      mediaUrl = mediaUrl + "&";
    } 
    else {
      mediaUrl = mediaUrl + "?";
    }

    $csjq.ajaxSetup({cache:false});
    $csjq.ajax({
      url: mediaUrl,
      dataType: "jsonp",
      success: mediaTitleCallback,
      error: function(xhr, ajaxOptions, thrownError) {
        $csjq('select[name="cdccs_title"]').prop('disabled', false);
      }
    });    
  };

  var resetForm = function () {
    $csjq('input[name="cdccs_sourceval"]').val("");
    $csjq('input[name="cdccs_fromdate"]').val("");
    var topictree = $csjq('div[id="cdccs_topictree_control"]');
    if (topictree && !!topictree.jstree(true).destroy) {
      topictree.jstree(true).destroy();
    }
    $csjq('div[id="cdccs_topictree_control"]').html("");
    $csjq('input[name="cdccs_topictree"]').val("");
    var titleSelect = $csjq('select[name="cdccs_title"]');
    titleSelect.find('option').remove();
    var mediaTitleSelect = $csjq('select[name="cdccs_mediatypes[]"]');
    mediaTitleSelect.find('option').remove();
    $csjq('input[name="cdccs_mediatypesval"]').val("");
    $csjq('input[name="cdccs_titleval"]').val("");
    clearPreview();
  };

  var parseFromDate = function (fromDate) {
    var parts = fromDate.match(/(\d+)-(\d+)-(\d+) (\d+):(\d+):(\d+)/);
    return new Date(+parts[1], parts[2]-1, +parts[3], +parts[4], +parts[5], +parts[6]);
  };

  var htmlDecode = function (value) {
    if (value) {
      return $csjq('<div />').html(value).text();
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
      if ($csjq.inArray(''+treeNode.id, selectedItems) > -1) {
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
    $csjq('div[id="cdccs_preview_div"]').html("");
  };

  var previewError = function () {
    $csjq('input[name="cdccs_preview"]').val(""); 
    $csjq('div[id="cdccs_preview_div"]')
      .html("<p>There was a problem loading the content for preview, please refresh and try again</p>");
  };

  var loadingTopics = function (showIcon) {
    if (showIcon) {
      $csjq('div[id="cdccs_topictree_control"]').html('<img src="' + scriptPath + '../css/throbber.gif"/>');
    } 
    else {
      $csjq('div[id="cdccs_topictree_control"]').html('');
    }
  };

  var loadingPreview = function (showIcon) {
    if (showIcon) {
      $csjq('div[id="cdccs_preview_div"]').html('<img src="' + scriptPath + '../css/throbber.gif"/>');
    } 
    else {
      $csjq('div[id="cdccs_preview_div"]').html('');
    }
  };

  //Initialize
  init();
};

$csjq(document).ready(function() {
  var cdcContentSynd = new CDCContentSynd();
});

