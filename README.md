HHS Digital Media Module for Drupal 7
================

Last updated: July 21, 2014

Authors: [Brian Williamson](http://www.github.com/bhwilliamson)

## General Information
This is a Drupal module that can be used to search and embed HHS Digital 
Media content.  It has been built and tested on Drupal 7.28.  It is based 
on the pure HTML & Javascript module found 
[Here](https://github.com/HHSDigitalMediaAPIPlatform/HHSDigitalMediaModuleHTML).

## Installation & Setup
Install the module like you would install any other Drupal module.
The following additional steps are required:
1. This module depends on jquery_update module to be installed and enabled 
first.
https://www.drupal.org/project/jquery_update is the project page.
2. You also need to download the following 3rd party javascript libraries
and put them in the <module_location>/html/js directory.
  * jstree.js (v 3.0.0) : 
    * http://www.jstree.com/
  * jquery.maskedinput.js (v 1.3.1) : 
    * http://digitalbush.com/projects/masked-input-plugin/
3. As part of the jstree library please add the jstree style.css file
to <module_location>/html/css and rename the file treestyle.css if
it is not already named treestyle.css.

Once installed you should find a new module type called 
*HHS Digital Media Syndication*, enable the module 
and configure to create pages and blocks of syndicated content.

## Use
Click on the Configure link for the *HHS Digital Media Syndication* module from 
the /admin/modules screen.  Here you can add new syndicated items, or edit 
and delete existing items.  In the syndicated item editor form start by entering
 a *Title*, then select a *Source* for the content.  That will populate 
supported media types and topics from that source.  Use the *From Date*, 
*Media Types*, and *Topics* fields to filter the list of available titles.  
Select a title to see a preview of the syndicated content.  There are also 
display options for controlling the display of the content.  Any display 
settings that affect the title selected will cause the preview to refresh.

## Getting Help
For help with this module please contact [IMTech](mailto:imtech@cdc.gov)
