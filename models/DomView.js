import { extractHostName } from '../helpers/classHelpers.js';
import { StoryList } from './StoryList.js';
import { User } from './User.js';

/* instance contains all Dom related display items and methods */
export class DomView {
  constructor() {
    this.storyList = [];
    this.user = new User();
    this.state = 'all'; // test feature (state) 'all' or 'fav'
  }

  // displays update to date list of stories to DOM
  async displayStories() {
    if (this.state === 'all') {
      // app state is on 'all' stories, re-render entire page
      await this.displayAllStories();
    } else if (this.state === 'fav') {
      // app state is on favorites, re-render only favorites
      this.displayFavoriteStories();
    }
  }

  // display all stories to DOM
  async displayAllStories() {
    $('#stories').empty();
    this.storyList = await StoryList.getStories();
    // iterate over stories and display each story
    this.storyList.stories.forEach(storyObj => {
      this.displaySingleStory(storyObj);
    });
  }

  // display only user's favorite stories
  displayFavoriteStories() {
    // delete all existing stories in order to re-render page
    $('#stories').empty();

    // take each story in user favorites and display
    this.user.favorites.forEach(storyObj => {
      this.displaySingleStory(storyObj);
    });
  }

  // display a single story to dom container
  displaySingleStory(storyObj) {
    const hostname = extractHostName(storyObj.url);

    // determines if we should show delete button & edit button
    let delClass = '';
    let editClass = '';
    if (this.isUserOwnedStory(storyObj.storyId)) {
      // user is author, show delete link
      delClass = 'delete--element';
      editClass = 'edit--elemenent';
    } else {
      // user is not author, hide delete link
      delClass = 'delete--element element--hide';
      editClass = 'edit--elemenent element--hide';
    }

    // determines what type of favorite star to display
    let favClass;
    if (this.user.name === undefined) {
      // user is not logged in, hide favorites element
      favClass = 'element--hide';
    } else if (this.isStoryInUserFavorites(storyObj.storyId)) {
      // user is logged in, story is in favorites, show solid star
      favClass = 'fas fa-star px-1';
    } else {
      // user is logged in, story is not in favorites, show outline of star
      favClass = 'far fa-star px-1';
    }

    // create jQuery call and send to DOM
    this.sendStoryToDom(storyObj, hostname, favClass, editClass, delClass);
  }

  // helper function to build jQuery story and append to DOM
  sendStoryToDom(storyObj, hostname, favClass, editClass, delClass) {
    // Sample Reference Story Format
    // <li id="234734908284093284092384092">
    //   <div class="story--header">
    //     <span class="far fa-star"></span>
    //     <a target="_blank" href="https://visualgo.net/">Visualizing Algorithms</a>
    //     <small>(visualgo.net)</small>
    //   </div>
    //   <div class="story--detail">
    //     <span class="hidden">
    //     <a href="#">Delete Story</a>
    //     </span>
    //     <span class="hackorsnoozedetails">
    //     </span>
    //   </div>
    // </li>

    // render story element to dom container
    $('#stories').append(
      $('<li>')
        .attr('id', storyObj.storyId)
        .append(
          $('<div>')
            .addClass('story--header')
            .append($('<span>').addClass(favClass))
            .append(
              $('<a>')
                .attr('target', '_blank')
                .attr('href', storyObj.url)
                .text(storyObj.title)
            )
            .append($('<small>').text(`(${hostname})`))
        )
        .append(
          $('<div>')
            .append(
              $('<span>')
                .addClass(delClass)
                .append(
                  $('<span>')
                    .addClass('badge badge-primary mx-1')
                    .text('Delete')
                )
            )
            .append(
              $('<span>')
                .addClass(editClass)
                .append(
                  $('<span>')
                    .addClass('badge badge-primary mx-1')
                    .text('Edit Story')
                    .attr('data-toggle', 'modal')
                    .attr('data-target', '#storyModal')
                )
            )
            .append(
              $('<span>')
                .addClass('')
                .append($('<small>').text(`Posted by: ${storyObj.author}`))
            )
            .addClass('story--detail')
        )
    );
  }

  // determine if story is one authored by the user (boolean)
  isUserOwnedStory(targetStoryId) {
    // if user is not logged in, return false
    if (this.user.name === undefined) {
      return false;
    }
    // finds the index of the story user's ownStories array that matches targetStoryId
    const storyObjIndex = this.user.ownStories.findIndex(storyObj => {
      return storyObj.storyId === +targetStoryId;
    });
    // if targetStoryId is not found in ownStories, return false, otherwise true
    if (storyObjIndex === -1) {
      return false;
    }
    return true;
  }

  // determine if a story is in our user favorites (boolean)
  isStoryInUserFavorites(targetStoryId) {
    // if user is not defined yet, return false
    if (this.user.name === undefined) {
      return false;
    }
    // finds the index of the storyObj in the favorites array that matches targetStoryId
    const storyObjIndex = this.user.favorites.findIndex(storyObj => {
      return storyObj.storyId === +targetStoryId;
    });
    // if targetStoryId is not found in favoriteStories, return false, otherwise true
    if (storyObjIndex === -1) {
      return false;
    }
    return true;
  }

  // submits login info from form to API
  async loginUserSubmission(event) {
    // set target state to 'all'
    this.state = 'all';
    if (event) {
      event.preventDefault();
    }
    const $username = $('#username');
    const $password = $('#password');
    const usernameInput = $username.val();
    const passwordInput = $password.val();

    this.user.username = usernameInput;

    // send API call to login, retrieve user details, render logged in state, displayAllStories
    try {
      await this.user.login(passwordInput);

      // store items in local storage
      localStorage.setItem('token', this.user.loginToken);
      localStorage.setItem('username', this.user.username);

      await this.user.retrieveDetails();
      await this.checkForLoggedUser();
      await this.displayStories();

      // clear fields after successful login & close open containers
      this.hideAllContainers();
      $username.val('');
      $password.val('');
    } catch (error) {
      this.flashMessage('Invalid Credentials.', 'danger');
    }
  }

  // make a request to API to log user out
  async logUserOut() {
    // set target state to 'all'
    this.state = 'all';

    // empty user info in localStorage
    localStorage.clear();

    this.hideAllContainers();
    // delete all Local User Data
    this.user = new User();
    // rerender full stories
    await this.checkForLoggedUser();
    await this.displayStories();
  }

  // check if a user is currently logged in and then execute callback
  async checkForLoggedUser() {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');

    // If user token is found in LocalStorage
    if (token) {
      // Show Logged-in User Specific Links
      $('#addStory').show();
      $('#favorites').show();
      $('#nouserlogged-nav').hide();
      $('#userlogged-nav').show();

      // stories login info into User instance, retrieve user info from API and render DOM elements
      this.user.loginToken = token;
      this.user.username = username;
      await this.user.retrieveDetails();

      // Display Username as Link on Nav
      $('#profile').text(this.user.name);
    } else {
      // show navbar buttons for no logged in user
      $('#nouserlogged-nav').show();

      // hide navbar links
      $('#addStory').hide();
      $('#favorites').hide();
      $('#userlogged-nav').hide();
      // remove name from profile button
      $('#profile').empty();
    }
  }

  // submits create user request to API
  async submitCreateUser(event) {
    // set target state to 'all'
    this.state = 'all';

    event.preventDefault();
    const $createDisplayName = $('#create-displayname');
    const $createUsername = $('#create-username');
    const $createPassword = $('#create-password');
    const $createPhone = $('#create-phone');

    // grab values from create user forms
    const name = $createDisplayName.val();
    const username = $createUsername.val();
    const password = $createPassword.val();
    const phone = $createPhone.val();

    try {
      // submit data to API for user creation
      const user = await User.create({ username, password, name, phone });

      // items to save to localStorage to check for logged in user
      localStorage.setItem('token', user.loginToken);
      localStorage.setItem('username', user.username);

      await this.checkForLoggedUser();
      await this.displayStories();

      // clear out values
      this.hideAllContainers();
      $createDisplayName.val('');
      $createUsername.val('');
      $createPassword.val('');
      $createPhone.val('');
      this.flashMessage(
        'Your account has been created! Logging in.',
        'success'
      );
    } catch (error) {
      this.flashMessage(error.responseJSON.error.message, 'danger');
    }
  }

  // submits add new story request to API
  async submitNewStory(event) {
    event.preventDefault();

    // grab values from add new story form
    const title = $('#title').val();
    const author = this.user.name;
    const url = $('#url').val();

    const storyDataObj = {
      title,
      author,
      url
    };

    try {
      // submit data to API for adding new story
      await this.storyList.addStory(this.user, storyDataObj);
      await this.user.retrieveDetails();
      await this.displayStories();

      // clear values and hide containers
      this.hideAllContainers();
      $('#title').val('');
      $('#url').val('');
      this.flashMessage('Story added!', 'success');
    } catch (error) {
      this.flashMessage('Error adding story.', 'danger');
    }
  }

  // submits create user profile modification request to API
  async submitUpdateUserProfile(event) {
    event.preventDefault();

    // grab the values from the submit user changes form
    const $updateProfileDisplayName = $('#updateprofile-displayname');
    const $updateProfilePassword = $('#updateprofile-password');

    const name = $updateProfileDisplayName.val();
    const password = $updateProfilePassword.val();

    let patchDataObj = {
      name
    };

    // if password data was passed
    if (password) {
      patchDataObj.password = password;
    }

    try {
      // send api request, then hide user profile change form and update username in navbar
      await this.user.update(patchDataObj);
      $('#updateprofile-form').slideUp();
      $('#profile').text(name);

      $updateProfileDisplayName.val('');
      $updateProfilePassword.val('');
      this.flashMessage('Profile successfully updated.', 'success');
    } catch (error) {
      this.flashMessage(
        'Profile failed to update. Check your inputs.',
        'danger'
      );
    }

    // TODO future: confirm old password to create new password on file
  }

  // show form for viewing and updating user profile info
  showUserProfileForm(event) {
    event.preventDefault();
    // hide all other containers
    this.selectiveHideContainers('updateprofile-form');
    // toggle specific container
    $('#updateprofile-form').slideToggle();

    // populate form with name, username
    $('#updateprofile-username').val(this.user.username);
    $('#updateprofile-displayname').val(this.user.name);
  }

  // add & remove stories from favorites status
  async toggleStoryFavStatus(event) {
    // retrieve story id of parent li target = storyID
    const storyId = $(event.target)
      .closest('li')
      .attr('id');

    // logic for adding/remove story for userFavorites
    if (this.isStoryInUserFavorites(storyId)) {
      // story in currently in favorites, remove request via APi call
      await this.user.removeFavorite(storyId);
      // swaps rendering of star on click
      $(event.target).toggleClass('far fas');
      await this.user.retrieveDetails();
    } else {
      // story in currently not in favorites, add request via APi call
      await this.user.addFavorite(storyId);
      // swaps rendering of star on click
      $(event.target).toggleClass('far fas');
      await this.user.retrieveDetails();
    }
  }

  // submits delete story request to API
  async submitDeleteStory(event) {
    event.preventDefault();
    // retrieve story id of parent li target = storyID
    const storyId = $(event.target)
      .closest('li')
      .attr('id');

    // make api call to delete a story, then rerender page w/ display all stories
    await this.storyList.removeStory(this.user, storyId);
    await this.user.retrieveDetails();
    await this.displayStories();
  }

  // toggles display between favorite stories and all stories
  async toggleDisplayFavStories() {
    this.hideAllContainers();
    const currentLinkText = $('#favorites').text();
    if (currentLinkText === 'favorites') {
      // display favorites and change link to all
      $('#favorites').text('all');

      // set target state to 'fav'
      this.state = 'fav';

      await this.displayFavoriteStories();
    } else if (currentLinkText === 'all') {
      // set target state to 'all'
      this.state = 'all';

      // display all stories and change link to favorites
      $('#favorites').text('favorites');
      await this.displayStories();
    }
  }

  // retrieve details on selected story and push to modal
  showStoryOnModal(event) {
    // event.relatedTarget grabs button element in story container
    const storyId = $(event.relatedTarget)
      .closest('li')
      .attr('id');

    // obtain index in user ownStories with matching ID
    const targetStoryIdx = this.user.ownStories.findIndex(story => {
      return story.storyId === +storyId;
    });

    const title = this.user.ownStories[targetStoryIdx].title;
    const url = this.user.ownStories[targetStoryIdx].url;
    $('#edit-title')
      .val(title)
      .attr('data-storyId', storyId);
    $('#edit-url').val(url);
  }

  // submit story modification to API
  async submitStoryModification() {
    const storyId = $('#edit-title').attr('data-storyId');
    const updatedTitle = $('#edit-title').val();
    const updatedUrl = $('#edit-url').val();

    // hide Modal after submit
    $('#editStoryModal').modal('hide');

    // find story in ownStoriesIdx for AJAX Call
    const targetStoryIdx = this.user.ownStories.findIndex(story => {
      return story.storyId === +storyId;
    });

    // modified story data obj for sending to API
    const storyData = {
      author: this.user.name,
      title: updatedTitle,
      url: updatedUrl
    };

    // initiate call api ajax call, then re-render all stories to reflect change
    await this.user.ownStories[targetStoryIdx].update(this.user, storyData);
    await this.user.retrieveDetails();
    await this.displayStories();
  }

  /** helper function to hide all form container minus the target */
  selectiveHideContainers(idToLeaveShowing) {
    const containers = [
      'resetpassword-formgroup',
      'new-form',
      'createuser-form',
      'updateprofile-form'
    ];

    containers.forEach(containerId => {
      if (containerId !== idToLeaveShowing) {
        $(`#${containerId}`).slideUp();
      }
    });
  }

  /** helper function to hide all form containers */
  hideAllContainers() {
    $('.slide-container').slideUp();
  }

  /** helper function to flash messages */
  // example ('Logged in successfully!', 'success');
  flashMessage(message, alertStyle) {
    const $navbarFlash = $('#navbar-flash');
    $navbarFlash
      .text(message)
      .addClass(`alert-${alertStyle}`)
      .show();

    // remove flash message after timeout
    setTimeout(() => {
      $navbarFlash
        .text('')
        .removeClass(`alert-${alertStyle}`)
        .hide();
    }, 3000);
  }

  /** helper to submit recovery request to API */
  async submitRecoveryRequest(event) {
    event.preventDefault();
    const username = $('#recovery-username').val();

    // add recovery-username to localStorage
    localStorage.setItem('recovery-username', username);

    // send recovery request - async is fine
    User.sendRecoveryCode(username);

    // flash message and clear after timeout
    $('#reset-form-flash').text('Recovery request sent!');
    $('#recovery-username').val('');
    setTimeout(() => {
      $('#reset-form-flash').text('');
    }, 5000);
  }

  /** helper to submit recovery code validation to API */
  async submitRecoveryCodeValidation(event) {
    event.preventDefault();
    // set target state to 'all'
    this.state = 'all';

    const $validateFromFlash = $('#validate-form-flash');
    const $validateCode = $('#validate-code');
    const $validateNewpassword = $('#validate-newpassword');

    // retrieve username from localStorage - reset attempt
    const username = localStorage.getItem('recovery-username');
    const code = $validateCode.val();
    const password = $validateNewpassword.val();

    let message;
    let shouldLogin = false;
    try {
      message = await User.resetPassword(code, username, password);
      // clear recovery info per succcess
      $validateCode.val('');
      $validateNewpassword.val('');
      localStorage.removeItem('recovery-username');
      shouldLogin = true;
      $validateFromFlash.text(`${message} Logging you in...`);
    } catch (error) {
      $validateFromFlash.text(error.responseJSON.error.message);
    }

    // do setup work to log user in
    if (shouldLogin === true) {
      // save username to localInstance and instance
      localStorage.setItem('username', username);
      this.user.username = username;

      // save token to user instance and localStorage and get details
      await this.user.login(password);
      localStorage.setItem('token', this.user.loginToken);
      await this.user.retrieveDetails();
    }

    // after delay, remove message and rerender page
    setTimeout(async () => {
      if (shouldLogin === true) {
        $('#resetpassword-formgroup').slideUp();
        await this.checkForLoggedUser();
        await this.displayStories();
        this.hideAllContainers();
      }
      // clear flash text
      $validateFromFlash.text('');
    }, 5000);
  }

  // createEventListeners for static DOM elements
  async createEventListeners() {
    /*------------------ Submit Events -------------------*/
    // event listener - submit user creation to API
    $('#createuser-form').submit(await this.submitCreateUser.bind(this));

    // event listener - submit add story to API
    $('#new-form').submit(await this.submitNewStory.bind(this));

    // event listener - submit update userprofile request to API
    $('#updateprofile-form').submit(async () => {
      await this.submitUpdateUserProfile(event);
      await this.displayStories();
    });

    // event listener - submit request to log user in
    $('#nouserlogged-nav').submit(await this.loginUserSubmission.bind(this));

    // event listener - submit recovery request to API
    $('#reset-form').submit(await this.submitRecoveryRequest.bind(this));

    // event listener to submit recovery code validation to API
    $('#validate-form').submit(
      await this.submitRecoveryCodeValidation.bind(this)
    );

    /*------------------ Click Events -------------------*/

    // event listener - show add story form
    $('#addStory').click(() => {
      // hide all other containers
      this.selectiveHideContainers('new-form');
      // toggle specific container
      $('#new-form').slideToggle();
    });

    // event listener -  toggle create user form
    $('#createuser-button').click(event => {
      event.preventDefault();
      // hide all other containers
      this.selectiveHideContainers('createuser-form');
      // toggle specific container
      $('#createuser-form').slideToggle();
    });

    // event lisetner - toggle recovery password form
    $('#reset-button').click(() => {
      // hide all other containers
      this.selectiveHideContainers('resetpassword-formgroup');
      // toggle specific container
      $('#resetpassword-formgroup').slideToggle();
    });

    // event listener - log user in
    $('#login-button').click(await this.loginUserSubmission.bind(this));

    // event listener - log out user
    $('#logout-button').click(await this.logUserOut.bind(this));

    // event listener - show hidden user profile modification form
    $('#loginContainer').on(
      'click',
      '#profile',
      this.showUserProfileForm.bind(this)
    );

    // event delegation for adding/remove stories from favorites
    $('#stories').on(
      'click',
      '.far, .fas',
      await this.toggleStoryFavStatus.bind(this)
    );

    // event delegation - delete a story the user authored
    $('#stories').on(
      'click',
      '.delete--element',
      await this.submitDeleteStory.bind(this)
    );

    // event listener - display all stories or just favorites depending on current link
    $('#favorites').click(await this.toggleDisplayFavStories.bind(this));

    // event listener for modal popup
    $('#storyModal').on(
      'show.bs.modal',
      await this.showStoryOnModal.bind(this)
    );

    // event listener for submitting story modification
    $('#update-story').click(await this.submitStoryModification.bind(this));
  }
}
