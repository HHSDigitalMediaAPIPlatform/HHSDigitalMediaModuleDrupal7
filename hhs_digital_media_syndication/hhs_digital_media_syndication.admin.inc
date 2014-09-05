<?php

/**
 * @file
 * Administration page callbacks for the hhs digital media syndication module.
 */

/**
 * Page callback: Displays the hhs digital media syndication module administration page.
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
 * Content synd Form, used for creating and editing hhs digital media syndication items.
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
  $form['content'] = array(
    '#type' => 'fieldset',
    '#title' => t('Select Content'),
    '#collapsible' => FALSE,
  );
  $form['content']['cdccs_source'] = array(
    '#type' => 'select',
    '#title' => t('Source'),
    '#description' => t('Select the source for the content you wish to syndicate'),
    '#default_value' => '',
    '#options' => array(),
    '#validated' => TRUE
  );
  $form['content']['cdccs_sourceval'] = array(
    '#type' => 'hidden',
    '#default_value' => isset($item->source) ? $item->source : '',
  );
  $form['content']['cdccs_fromdate'] = array(
    '#type' => 'textfield',
    '#title' => t('From Date'),
    '#default_value' => isset($item->from_date) ? format_date($item->from_date, 'custom', 'm/d/Y') : '',
    '#size' => 20,
    '#description' => t('Only show titles modified after this date'),
  );
  $form['content']['cdccs_mediatypes'] = array(
    '#type' => 'select',
    '#title' => t('Media Types'),
    '#description' => t('Select one or more media types to filter the list of titles'),
    '#multiple' => TRUE,
    '#default_value' => '',
    '#options' => array(),
    '#validated' => TRUE,
  );
  $form['content']['cdccs_mediatypesval'] = array(
    '#type' => 'hidden',
    '#default_value' => isset($item->media_types) ? $item->media_types : '',
  );
  $form['content']['cdccs_topictree'] = array(
    '#type' => 'hhs_digital_media_syndication_jstree',
    '#title' => t('Topics'),
    '#default_value' => isset($item->topics) ? $item->topics : '',
    '#description' => t('Select one or more topics to filter the list of titles'),
  );
  $form['content']['cdccs_title'] = array(
    '#type' => 'select',
    '#title' => t('Title'),
    '#description' => t('Select a title to preview the syndicated content'),
    '#default_value' => '',
    '#options' => array(),
    '#validated' => TRUE,
  );
  $form['content']['cdccs_titleval'] = array(
    '#type' => 'hidden',
    '#default_value' => isset($item->media_id) ? $item->media_id : '',
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
  $form['display']['cdccs_hidetitle'] = array(
    '#type' => 'checkbox',
    '#title' => t('Hide Content Title'),
    '#description' => t('Hide title if present in syndicated content'),
    '#default_value' => isset($item->hide_title) ? $item->hide_title : '',
  );
  $form['display']['cdccs_hidedescription'] = array(
    '#type' => 'checkbox',
    '#title' => t('Hide Content Description'),
    '#description' => t('Hide description if present in syndicated content'),
    '#default_value' => isset($item->hide_description) ? $item->hide_description : '',
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
    $path . '/html/js/jquery-1.9.1.js',
    // $path . '/html/js/jquery-1.9.1-noconflict.js',
    // Removed b/c noconflict added directly to jquery js file b/c drupal.
    // Adding other js files between jquery and noconflict file causing errors.
    $path . '/html/js/jstree.js',
    $path . '/html/js/jquery.maskedinput.js',
    $path . '/html/js/hhs_digital_media_syndication.js',
  );

  return $form;
}

/**
 * HHS Digital Media Synd Form validation handler.
 */
function hhs_digital_media_syndication_form_validate($form, &$form_state) {
}

/**
 * HHS Digital Media Synd Form submit handler
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
