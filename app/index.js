// import Application DomView Class Abstraction
import { DomView } from '../classes/DomView.js';

//Wait for DOM-Onload for jQuery
$(function() {
  // startup app
  initializeApp();

  // sequence of actions need to render starter page
  async function initializeApp() {
    const domView = new DomView();
    // check for logged in user, then display all user stories
    await domView.checkForLoggedUser();
    await domView.displayStories();

    // run all event listeners in domView instance
    domView.createEventListeners();
  }
});
