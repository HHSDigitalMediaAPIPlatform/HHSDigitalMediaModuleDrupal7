<?php

/**
 * @file
 * Page callbacks for the content syndication module.
 */

/**
 * Page callback: Displays the content syndication module page.
 *
 * @return string
 *      A HTML-formatted string with page content.
 */
function hhs_digital_media_syndication_page_view($item) {
  $item_source = theme('hhs_digital_media_syndication_item', array('item' => $item));
  return $item_source;
}

