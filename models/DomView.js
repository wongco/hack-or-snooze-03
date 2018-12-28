import { StoryList } from './StoryList.js';
import { User } from './User.js';

/* instance contains all Dom related display items and methods */
export class DomView {
  constructor() {
    this.storyList = [];
    this.user = new User();
  }

  // calls getStories and displays most recent list of stories to DOM
  async displayAllStories() {
    // delete all existing stories in parent container
    $('#stories').empty();

    this.storyList = await StoryList.getStories();

    // we have the stories, iterate over stories array and display each story
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
    const hostname = this.extractHostName(storyObj);

    // determines if we should show delete button & edit button
    let deleteClassString = '';
    let editClassString = '';
    if (this.isUserOwnedStory(storyObj.storyId)) {
      // user is author, show delete link
      deleteClassString = 'delete--element';
      editClassString = 'edit--elemenent';
    } else {
      // user is not author, hide delete link
      deleteClassString = 'delete--element element--hide';
      editClassString = 'edit--elemenent element--hide';
    }

    // determines what type of favorite star to display
    let favoriteClassString;
    if (this.user.name === undefined) {
      // user is not logged in, hide favorites element
      favoriteClassString = 'far fa-star element--hide';
    } else if (this.isStoryInUserFavorites(storyObj.storyId)) {
      // user is logged in, story is in favorites, show solid star
      favoriteClassString = 'fas fa-star';
    } else {
      // user is logged in, story is not in favorites, show outline of star
      favoriteClassString = 'far fa-star';
    }

    // render story element to dom container
    $('#stories').append(
      $('<li>')
        .attr('id', storyObj.storyId)
        .append(
          $('<div>')
            .addClass('story--header')
            .append($('<span>').addClass(favoriteClassString))
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
                .addClass(deleteClassString)
                .append(
                  $('<span>')
                    .addClass('badge badge-primary mx-1')
                    .text('Delete')
                )
            )
            .append(
              $('<span>')
                .addClass(editClassString)
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

  // extracts hostname from storyObj and return result
  extractHostName(storyObj) {
    // turn storyObj into jQuery anchor link obj
    let $newLink = $('<a>', {
      href: storyObj.url
    });

    // extract hostname from jQuery anchor link obj
    let hostname = $newLink
      .prop('hostname')
      .split('.')
      .slice(-2)
      .join('.');

    return hostname;
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
  async loginUserSubmission() {
    event.preventDefault();
    const usernameInput = $('#username').val();
    const passwordInput = $('#password').val();

    this.user.username = usernameInput;

    // send API call to login, retrieve user details, get recent stories then
    //     render logged in state, displayAllStories
    await this.user.login(passwordInput);
    await this.user.retrieveDetails();
    this.storyList = await StoryList.getStories();
    await this.checkForLoggedUser();
    await this.displayAllStories();
  }

  // make a request to API to log user out
  async logUserOut() {
    // delete Local Storage
    localStorage.clear();
    // delete all Local User Data
    this.user = new User();
    // rerender full stories
    this.storyList = await StoryList.getStories();
    await this.checkForLoggedUser();
    await this.displayAllStories();
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

      // stories login info into User instance, retrieve user info from API and render DOM elements
      this.user.loginToken = token;
      this.user.username = username;
      await this.user.retrieveDetails();

      // Create DOM Elements in right side of nav-bar (Username/Profile Link & Logout)
      const displayName = this.user.name;
      $('#loginContainer').empty();
      $('#loginContainer')
        .append(
          $('<span>').append(
            $('<a>')
              .text(displayName)
              .addClass('mr-2')
              .attr('href', 'javascript:void(0)')
              .attr('id', 'profile')
          )
        )
        .append(
          $('<button>')
            .text('Logout')
            .addClass('btn btn-dark my-2 my-sm-0')
            .attr('type', 'submit')
            .on('click', await this.logUserOut.bind(this))
        );
    } else {
      // User token does not exist. Create sign in on right side of nav bar

      // logic to hide user-required links on navbar
      $('#addStory').hide();
      $('#favorites').hide();

      $('#loginContainer').empty();
      $('#loginContainer').append(
        $('<form>')
          .addClass('form-inline my-2 my-lg-0')
          .append(
            $('<input>')
              .addClass('form-control mr-sm-2')
              .attr('type', 'text')
              .attr('placeholder', 'Username')
              .attr('id', 'username')
          )
          .append(
            $('<input>')
              .addClass('form-control mr-sm-2')
              .attr('type', 'password')
              .attr('placeholder', 'Password')
              .attr('id', 'password')
          )
          .append(
            $('<button>')
              .text('Login')
              .addClass('btn btn-dark my-2 my-sm-0')
              .attr('type', 'submit')
              .on('click', await this.loginUserSubmission.bind(this))
          )
          .append(
            $('<button>')
              .text('Create User')
              .addClass('btn btn-success my-2 my-sm-0 ml-1')
              .attr('id', 'createuser-button')
              .on('click', event => {
                event.preventDefault();
                $('#createuser-form').slideToggle();
              })
          )
      );
    }
  }

  // submits create user request to API
  async submitCreateUser(event) {
    event.preventDefault();

    // grab values from create user forms
    const name = $('#create-displayname').val();
    const username = $('#create-username').val();
    const password = $('#create-password').val();

    // submit data to API for user creation
    User.create(username, password, name);
    $('#createuser-form').slideUp();
    await this.checkForLoggedUser();
    await this.displayAllStories();
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

    // submit data to API for adding new story
    await this.storyList.addStory(this.user, storyDataObj);
    $('#new-form').slideToggle();
    await this.user.retrieveDetails();
    $('#title').val('');
    $('#url').val('');
    await this.displayAllStories();
  }

  // submits create user profile modification request to API
  async submitUpdateUserProfile() {
    // grab the values from the submit user changes form
    const name = $('#updateprofile-displayname').val();
    const password = $('#updateprofile-password').val();

    const patchDataObj = {
      name,
      password
    };

    // send api request, then hide user profile change form and update username in navbar
    await this.user.update(patchDataObj);
    $('#updateprofile-form').slideUp();
    $('#profile').text(name);

    // TODO future: if you show username/name details in the stories, have to re-render stories
    // TODO future: confirm old password to create new password on file
  }

  // show form for viewing and updating user profile info
  showUserProfileForm(event) {
    event.preventDefault();
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

    // Optional TODO, you may want to rerender favorites page after toggles
    //   need to pull current text value of favorites link to determine which view to rerender
    //       displayfavorites or displayall
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
    await this.displayAllStories();
  }

  // toggles display between favorite stories and all stories
  async toggleDisplayFavStories() {
    const currentLinkText = $('#favorites').text();
    if (currentLinkText === 'favorites') {
      // display favorites and change link to all
      $('#favorites').text('all');
      await this.displayFavoriteStories();
    } else if (currentLinkText === 'all') {
      // display all stories and change link to favorites
      $('#favorites').text('favorites');
      await this.displayAllStories();
    }
  }

  // retrieve details on selected story and push to modal
  retrieveStoryDetails(event) {
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
    await this.displayAllStories();
  }

  // createEventListeners for static DOM elements
  async createEventListeners() {
    /*------------------ Submit Events -------------------*/
    // event listener - submit user creation to API
    $('#createuser-form').submit(await this.submitCreateUser.bind(this));

    // event listener - submit add story to API
    $('#new-form').submit(await this.submitNewStory.bind(this));

    // event listener - submit update userprofile request to API
    $('#updateprofile-form').submit(
      await this.submitUpdateUserProfile.bind(this)
    );

    /*------------------ Click Events -------------------*/

    // event listener - show add story form
    $('#addStory').click(() => {
      $('#new-form').slideToggle();
    });

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
      await this.retrieveStoryDetails.bind(this)
    );

    // event listener for submitting story modification
    $('#update-story').click(await this.submitStoryModification.bind(this));
  }
}