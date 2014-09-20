// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

goog.provide('goog.editor.ClickToEditWrapperTest');
goog.setTestOnly('goog.editor.ClickToEditWrapperTest');

goog.require('goog.dom');
goog.require('goog.dom.Range');
goog.require('goog.editor.ClickToEditWrapper');
goog.require('goog.editor.SeamlessField');
goog.require('goog.testing.MockClock');
goog.require('goog.testing.events');
goog.require('goog.testing.jsunit');
goog.require('goog.userAgent');
goog.require('goog.userAgent.product');

var FIELD;
var CLOCK;
var HTML;

function setUp() {
  HTML = goog.dom.getElement('root').innerHTML;
  CLOCK = new goog.testing.MockClock(true);

  // The following 3 lines are to get around an IE bug where it says
  // 'Incompatible markup pointers for this operation'.
  // Must be done in the setup, not teardown, or else it won't take effect for
  // the first test that is run, or any test that runs immediately after a
  // "breaking async" message from the jsunit framework.
  goog.dom.Range.clearSelection();
  window.blur();
  window.focus();
}

function setUpField(opt_isBlended) {
  FIELD = opt_isBlended ? new goog.editor.SeamlessField('testField') :
      new goog.editor.SeamlessField('testField');

  (new goog.editor.ClickToEditWrapper(FIELD));

  goog.dom.Range.clearSelection();
}

function tearDown() {
  if (FIELD) {
    FIELD.dispose();
  }

  CLOCK.dispose();

  goog.dom.getElement('root').innerHTML = HTML;
}

function testClickToEdit(opt_isBlended) {
  setUpField(opt_isBlended);

  var text = goog.dom.getElement('testField').firstChild;
  goog.dom.Range.createFromNodes(text, 4, text, 8).select();

  goog.testing.events.fireClickSequence(text.parentNode);

  assertFalse('Field should not be made editable immediately after clicking',
      FIELD.isLoaded());
  CLOCK.tick(1);
  assertTrue('Field should be editable', FIELD.isLoaded());

  var dom = FIELD.getEditableDomHelper();
  var selection = goog.dom.Range.createFromWindow(dom.getWindow());

  var body = FIELD.getElement();
  text = body.firstChild;

  assertEquals('Wrong start node', text, selection.getStartNode());
  assertEquals('Wrong end node', text, selection.getEndNode());
  assertEquals('Wrong start offset', 4, selection.getStartOffset());
  assertEquals('Wrong end offset', 8, selection.getEndOffset());
}

function testBlendedClickToEdit() {
  testClickToEdit(true);
}


function testClickToEditWithAnchor(opt_isBlended) {
  // We bail out if we are running on chrome+winxp because of flaky selenium
  // issues. TODO(user): Remove this assertion once we start running on the
  // JsUnit farm.
  if (goog.userAgent.product.CHROME && goog.userAgent.WINDOWS) {
    return;
  }
  setUpField(opt_isBlended);

  goog.dom.getElement('testAnchor').focus();
  goog.testing.events.fireClickSequence(goog.dom.getElement('testAnchor'));

  CLOCK.tick(1);
  assertTrue('Field should be editable', FIELD.isLoaded());

  var dom = FIELD.getEditableDomHelper();
  var selection = goog.dom.Range.createFromWindow(dom.getWindow());

  // IE and Gecko and Safari are all dumb and put the cursor
  // in different places.
  var body = FIELD.getElement();
  var text = body.firstChild;
  var link = dom.getElementsByTagNameAndClass('A', null, body)[0].firstChild;
  var isIEorWebkit = goog.userAgent.WEBKIT || goog.userAgent.IE;
  assertEquals('Wrong start node',
      isIEorWebkit ? text : link, selection.getStartNode());
  assertEquals('Wrong start offset',
      isIEorWebkit ? 17 : 0, selection.getStartOffset());
  assertEquals('Wrong end node',
      isIEorWebkit ? text : link, selection.getEndNode());
  assertEquals('Wrong end offset',
      isIEorWebkit ? 17 : 0, selection.getEndOffset());
}

function testBlendedClickToEditWithAnchor() {
  testClickToEditWithAnchor(true);
}
