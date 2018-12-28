import { DomView } from '../models/DomView.js';

//Wait for DOM-Onload for jQuery
$(function() {
  // startup app
  initializeApp();

  // sequence of actions need to render starter page
  async function initializeApp() {
    const domView = new DomView();
    // check for logged in user, then display all user stories
    await domView.checkForLoggedUser();
    await domView.displayAllStories();

    // run all event listeners in domView instance
    await domView.createEventListeners();
  }
});
