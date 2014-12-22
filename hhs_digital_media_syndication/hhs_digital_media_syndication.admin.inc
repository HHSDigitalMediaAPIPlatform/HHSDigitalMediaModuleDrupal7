<?php

/**
 * @file
 * Administration page callbacks for the hhs digital media syndication module.
 */

/**
 * Page callback.
 *
 * Displays the hhs digital media syndication module administration page.
 *
 * @return string
 *   A HTML-formatted string with administration page content.
 */
function hhs_digital_media_syndication_admin_view() {
  $page = '<h3>' . t('HHS Digital Media Syndication Items') . '</h3>';

  $result = db_query('SELECT * from {hhs_digital_media_syndication_item} order by title');

  $header = array(t('Title'), t('Operations'));

  $rows = array();

  foreach ($result as $item) {
    $rows[] = array(
      l($item->title, "hhs_digital_media_syndication/item/$item->iid"),
      l(t('edit'), "admin/config/content/hhs_digital_media_syndication/edit/$item->iid"),
    );
  }

  $page .= theme('table',
    array(
      'header' => $header,
      'rows' => $rows,
      'empty' => t('No syndication items found.  <a href="@link">Add Syndicated Item</a>.',
        array('@link' => url('admin/config/content/hhs_digital_media_syndication/add'))
      ),
    )
  );

  return $page;
}

/**
 * HHS Digital Media Syndication Form.
 *
 * Used for creating and editing hhs digital media syndication items.
 *
 * @see hhs_digital_media_syndication_menu()
 */
function hhs_digital_media_syndication_form($form, &$form_state, stdClass $item = NULL) {
  $form['title'] = array(
    '#type' => 'textfield',
    '#title' => t('Title'),
    '#default_value' => isset($item->title) ? $item->title : '',
    '#size' => 50,
    '#maxlength' => 255,
    '#description' => t('The title of the syndicated item.'),
    '#required' => TRUE,
  );
  $form['source'] = array(
    '#type' => 'fieldset',
    '#title' => t('Select Content Source'),
    '#collapsible' => FALSE,
  );
  $form['source']['cdccs_source'] = array(
    '#type' => 'select',
    '#title' => t('Source'),
    '#description' => t('Select the source for the content you wish to syndicate'),
    '#default_value' => '',
    '#options' => array(),
    '#validated' => TRUE,
  );
  $form['search_type_grp'] = array(
    '#type' => 'fieldset',
    '#title' => t('Select Search Type'),
    '#collapsible' => FALSE,
  );
  $form['search_type_grp']['cdccs_searchtype'] = array(
    '#type' => 'radios',
    '#title' => t('Search By'),
    '#default_value' => isset($item->search_type) ? $item->search_type : 0,
    '#options' => array(0 => t('Metadata'), 1 => t('Url')),
    '#description' => t('Search by metadata, or search by url'),
  );
  $form['metadata_grp'] = array(
    '#type' => 'fieldset',
    '#title' => t('Search By Metadata'),
    '#collapsible' => TRUE,
    '#collapsed' => FALSE,
  );
  $form['metadata_grp']['cdccs_sourceval'] = array(
    '#type' => 'hidden',
    '#default_value' => isset($item->source) ? $item->source : '',
  );
  $form['metadata_grp']['cdccs_fromdate'] = array(
    '#type' => 'textfield',
    '#title' => t('From Date'),
    '#default_value' => isset($item->from_date) ? format_date($item->from_date, 'custom', 'm/d/Y') : '',
    '#size' => 20,
    '#description' => t('Only show titles modified after this date'),
  );
  $form['metadata_grp']['cdccs_mediatypes'] = array(
    '#type' => 'select',
    '#title' => t('Media Types'),
    '#description' => t('Select one or more media types to filter the list of titles'),
    '#multiple' => TRUE,
    '#default_value' => '',
    '#options' => array(),
    '#validated' => TRUE,
  );
  $form['metadata_grp']['cdccs_mediatypesval'] = array(
    '#type' => 'hidden',
    '#default_value' => isset($item->media_types) ? $item->media_types : '',
  );
  $form['metadata_grp']['cdccs_topictree'] = array(
    '#type' => 'hhs_digital_media_syndication_jstree',
    '#title' => t('Topics'),
    '#default_value' => isset($item->topics) ? $item->topics : '',
    '#description' => t('Select one or more topics to filter the list of titles'),
  );
  $form['metadata_grp']['cdccs_title'] = array(
    '#type' => 'select',
    '#title' => t('Title'),
    '#description' => t('Select a title to preview the syndicated content'),
    '#default_value' => '',
    '#options' => array(),
    '#validated' => TRUE,
  );
  $form['metadata_grp']['cdccs_titleval'] = array(
    '#type' => 'hidden',
    '#default_value' => isset($item->media_id) ? $item->media_id : '',
  );
  $form['url_grp'] = array(
    '#type' => 'fieldset',
    '#title' => t('Search By Url'),
    '#collapsible' => TRUE,
    '#collapsed' => TRUE,
  );
  $form['url_grp']['cdccs_url'] = array(
    '#type' => 'textfield',
    '#title' => t('Url Contains'),
    '#default_value' => isset($item->search_url) ? $item->search_url : '',
    '#size' => 100,
    '#maxlength' => 1000,
    '#description' => t('Search for syndicated content with urls containing this text.  Results limited to 30 items'),
  );
  $form['url_grp']['cdccs_urlmediaidval'] = array(
    '#type' => 'hidden',
    '#default_value' => isset($item->url_media_id) ? $item->url_media_id : '',
  );
  $form['display'] = array(
    '#type' => 'fieldset',
    '#title' => t('Display Options'),
    '#collapsible' => TRUE,
    '#collapsed' => TRUE,
  );
  $form['display']['cdccs_stripimages'] = array(
    '#type' => 'checkbox',
    '#title' => t('Strip Images'),
    '#description' => t('Strip images from returned content'),
    '#default_value' => isset($item->strip_images) ? $item->strip_images : '',
  );
  $form['display']['cdccs_stripscripts'] = array(
    '#type' => 'checkbox',
    '#title' => t('Strip Scripts'),
    '#description' => t('Strip scripts from returned content'),
    '#default_value' => isset($item->strip_scripts) ? $item->strip_scripts : '',
  );
  $form['display']['cdccs_stripanchors'] = array(
    '#type' => 'checkbox',
    '#title' => t('Strip Anchors'),
    '#description' => t('Strip anchors from returned content'),
    '#default_value' => isset($item->strip_anchors) ? $item->strip_anchors : '',
  );
  $form['display']['cdccs_stripcomments'] = array(
    '#type' => 'checkbox',
    '#title' => t('Strip Comments'),
    '#description' => t('Strip comments from returned content'),
    '#default_value' => isset($item->strip_comments) ? $item->strip_comments : '',
  );
  $form['display']['cdccs_stripinlinestyles'] = array(
    '#type' => 'checkbox',
    '#title' => t('Strip Inline Styles'),
    '#description' => t('Strip inline styles from returned content'),
    '#default_value' => isset($item->strip_inline_styles) ? $item->strip_inline_styles : '',
  );
  $form['display']['cdccs_stripbreaks'] = array(
    '#type' => 'checkbox',
    '#title' => t('Strip Line Breaks'),
    '#description' => t('Strip line breaks from returned content'),
    '#default_value' => isset($item->strip_breaks) ? $item->strip_breaks : '',
  );
  $form['display']['cdccs_imagefloat'] = array(
    '#type' => 'select',
    '#title' => t('Image Float'),
    '#description' => t('CSS float option for images in returned html content'),
    '#default_value' => isset($item->image_float) ? $item->image_float : '',
    '#options' => array(
      '' => t('Default'),
      'left' => t('Left'),
      'right' => t('Right'),
    ),
  );
  $form['display']['cdccs_cssclasses'] = array(
    '#type' => 'textfield',
    '#title' => t('CSS Classes (comma separated)'),
    '#default_value' => isset($item->css_classes) ? $item->css_classes : '',
    '#size' => 100,
    '#maxlength' => 1024,
    '#description' => t('Comma separated list of CSS classes.  Only content within elements with these classes will be returned.'),
  );
  $form['display']['cdccs_ids'] = array(
    '#type' => 'textfield',
    '#title' => t('Element Ids (comma separated)'),
    '#default_value' => isset($item->element_ids) ? $item->element_ids : '',
    '#size' => 100,
    '#maxlength' => 1024,
    '#description' => t('Comma separated list of element Ids.  Only content within elements with these Ids will be returned.'),
  );
  $form['display']['cdccs_xpath'] = array(
    '#type' => 'textfield',
    '#title' => t('XPath'),
    '#default_value' => isset($item->xpath) ? $item->xpath : '',
    '#size' => 100,
    '#maxlength' => 1024,
    '#description' => t('An xpath statement defining what should be retrieved from the content.'),
  );
  $form['display']['cdccs_namespace'] = array(
    '#type' => 'textfield',
    '#title' => t('Namespace Prefix'),
    '#default_value' => isset($item->namespace) ? $item->namespace : '',
    '#size' => 100,
    '#maxlength' => 128,
    '#description' => t('Used to decorate (prefix) the tags and ids in the results to prevent conflict with existing host page elements.'),
  );
  $form['display']['cdccs_linkssamewindow'] = array(
    '#type' => 'checkbox',
    '#title' => t('Links Open Same Window'),
    '#description' => t('Check to open in same window (default is new window)'),
    '#default_value' => isset($item->links_same_window) ? $item->links_same_window : '',
  );
  $form['display']['cdccs_width'] = array(
    '#type' => 'textfield',
    '#title' => t('Width'),
    '#default_value' => isset($item->width) ? $item->width : '',
    '#size' => 25,
    '#maxlength' => 8,
    '#description' => t('Set the width of various media types'),
  );
  $form['display']['cdccs_height'] = array(
    '#type' => 'textfield',
    '#title' => t('Height'),
    '#default_value' => isset($item->height) ? $item->height : '',
    '#size' => 25,
    '#maxlength' => 8,
    '#description' => t('Set the height of various media types'),
  );
  $form['display']['cdccs_https'] = array(
    '#type' => 'checkbox',
    '#title' => t('Use HTTPS'),
    '#description' => t('If checked, the calls to the source to fetch the content for embedding will use https rather than http.'),
    '#default_value' => isset($item->https) ? $item->https : '',
  );
  $form['display']['cdccs_encoding'] = array(
    '#type' => 'select',
    '#title' => t('Encoding'),
    '#description' => t('Encoding for returned content'),
    '#default_value' => isset($item->encoding) ? $item->encoding : '',
    '#options' => array(
      '' => t('Default'),
      'utf-8' => t('UTF-8'),
      'iso-8859-1' => t('iso-8859-1'),
    ),
  );
  $form['cdccs_preview'] = array(
    '#type' => 'hhs_digital_media_syndication_preview',
    '#title' => t('Preview'),
    '#default_value' => isset($item->syndication_url) ? $item->syndication_url : '',
    '#description' => t('Preview of syndicated content'),
  );

  $form['actions'] = array('#type' => 'actions');
  $form['actions']['submit'] = array(
    '#type' => 'submit',
    '#value' => t('Save'),
  );
  if (!empty($item->iid)) {
    $form['actions']['delete'] = array(
      '#type' => 'submit',
      '#value' => t('Delete'),
    );
    $form['iid'] = array(
      '#type' => 'hidden',
      '#value' => $item->iid,
    );
  }

  $path = drupal_get_path('module', 'hhs_digital_media_syndication');
  $form['#attached']['css'] = array(
    $path . '/html/css/treestyle.css',
    $path . '/html/css/hhs_digital_media_syndication.css',
  );
  $form['#attached']['js'] = array(
    $path . '/html/js/jstree.js',
    $path . '/html/js/jquery.maskedinput.js',
    $path . '/html/js/hhs_digital_media_syndication.js',
  );
  $form['#attached']['library'] = array(
    array('system', 'ui.autocomplete'),
  );

  return $form;
}

/**
 * HHS Digital Media Synd Form validation handler.
 */
function hhs_digital_media_syndication_form_validate($form, &$form_state) {
}

/**
 * HHS Digital Media Synd Form submit handler.
 */
function hhs_digital_media_syndication_form_submit($form, &$form_state) {
  $title = $form_state['values']['title'];

  // Unset title to trigger deletion on save.
  if ($form_state['values']['op'] == t('Delete')) {
    unset($form_state['values']['title']);
  }

  hhs_digital_media_syndication_item_save($form_state['values']);

  if (isset($form_state['values']['iid'])) {
    if (isset($form_state['values']['title'])) {
      drupal_set_message(t('The syndication item %title has been updated.', array('%title' => $title)));
      if (arg(0) == 'admin') {
        $form_state['redirect'] = 'admin/config/content/hhs_digital_media_syndication';
      }
      else {
        $form_state['redirect'] = 'hhs_digital_media_syndication/item/' . $form_state['values']['iid'];
      }
    }
    else {
      drupal_set_message(t('The syndication item %title has been deleted.', array('%title' => $title)));
      if (arg(0) == 'admin') {
        $form_state['redirect'] = 'admin/config/content/hhs_digital_media_syndication';
      }
      else {
        $form_state['redirect'] = 'hhs_digital_media_syndication/item/' . $form_state['values']['iid'];
      }
    }
  }
  else {
    drupal_set_message(t('The syndication item %title has been added.', array('%title' => $title)));
  }
}
