<?php

/**
 * @file
 * Page callbacks for the content syndication module.
 */

/**
 * Page callback: Displays the content syndication module page.
 *
 * @return
 *   A HTML-formatted string with page content.
 */
function content_synd_page_view($item) {
    $item_source = theme('content_synd_item', array('item' => $item));
    return $item_source;
}
