const API_BASE_URL = 'https://hack-or-snooze-v2.herokuapp.com';

/* instances contain a recent list a stories with methods to download, add & remove*/
class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  // downloads most recent 25 stories from api to local StoryList instance
  static getStories(cb) {
    $.getJSON(`${API_BASE_URL}/stories`, apiResponse => {
      const stories = apiResponse.stories.map(story => {
        const { author, title, url, username, storyId } = story;
        return new Story(author, title, url, username, storyId);
      });

      const storyList = new StoryList(stories);
      return cb(storyList); // return new storyList instance to callback
    });
  }

  // method to initiate api call to add a new story
  addStory(user, story, cb) {
    const postDataObj = { token: user.loginToken, story };

    $.post(`${API_BASE_URL}/stories`, postDataObj, apiResponse => {
      user.retrieveDetails(() => cb(apiResponse));
    });
  }

  // method to initiate api call to remove a story, then syncs api user details with local user
  removeStory(user, storyId, cb) {
    const deleteDataObj = { token: user.loginToken };

    $.ajax({
      url: `${API_BASE_URL}/stories/${storyId}`,
      method: 'DELETE',
      data: deleteDataObj,
      success: apiResponse => {
        // find index of story to remove from local instance of StoryList
        const storyIndex = this.stories.findIndex(
          story => story.storyId === storyId
        );
        // removes story from local instance
        this.stories.splice(storyIndex, 1);
        user.retrieveDetails(() => cb(apiResponse));
      }
    });
  }
}

/* instance contains all User details including token, favorited and authored stories */
class User {
  constructor(username, password, name, loginToken, favorites, ownStories) {
    this.username = username;
    this.password = password;
    this.name = name;
    this.loginToken = loginToken;
    this.favorites = favorites;
    this.ownStories = ownStories;
  }

  // static function that send a create new user request to API and returns new user to callback
  static create(username, password, name, cb) {
    const userDataObj = {
      user: {
        name,
        username,
        password
      }
    };

    $.post(`${API_BASE_URL}/signup`, userDataObj, apiResponse => {
      const { username, name, favorites, stories } = apiResponse.user;

      // items to save to localStorage to check for logged in user
      localStorage.setItem('token', apiResponse.token);
      localStorage.setItem('username', username);

      const user = new User(
        username,
        password,
        name,
        apiResponse.token,
        favorites,
        stories
      );
      return cb(user);
    });
  }

  // method for API request to log the user in and retrieves user token
  login(cb) {
    let loginDataObj = {
      user: {
        username: this.username,
        password: this.password
      }
    };
    $.post(`${API_BASE_URL}/login`, loginDataObj, apiResponse => {
      this.loginToken = apiResponse.token;

      // store items in local storage
      localStorage.setItem('token', apiResponse.token);
      localStorage.setItem('username', this.username);
      return cb(apiResponse);
    });
  }

  // make a request to the API to get updated info about a single user incl favs and own stories
  retrieveDetails(cb) {
    const getDataObj = {
      token: this.loginToken
    };

    $.get(`${API_BASE_URL}/users/${this.username}`, getDataObj, apiResponse => {
      this.name = apiResponse.user.name;
      this.favorites = apiResponse.user.favorites;
      this.ownStories = apiResponse.user.stories;

      // takes api response stories and maps them into Story instances
      this.ownStories = apiResponse.user.stories.map(story => {
        const { author, title, url, username, storyId } = story;
        return new Story(author, title, url, username, storyId);
      });

      return cb(this); // callback returns user instance
    });
  }

  // make an API request to add a story to the user’s favorites
  addFavorite(storyId, cb) {
    const postDataObj = {
      token: this.loginToken
    };

    $.post(
      `${API_BASE_URL}/users/${this.username}/favorites/${storyId}`,
      postDataObj,
      apiResponse => {
        this.retrieveDetails(() => cb(apiResponse)); // returns api response to callback
      }
    );
  }

  // make an API request to remove a story to the user’s favorites
  removeFavorite(storyId, cb) {
    let deleteDataObj = {
      token: this.loginToken
    };

    $.ajax({
      url: `${API_BASE_URL}/users/${this.username}/favorites/${storyId}`,
      method: 'DELETE',
      data: deleteDataObj,
      success: apiResponse => {
        this.retrieveDetails(() => cb(apiResponse)); // returns api response to callback
      }
    });
  }

  // make an API request to update a story
  update(userData, cb) {
    const patchDataObj = {
      token: this.loginToken,
      user: userData
    };

    $.ajax({
      url: `${API_BASE_URL}/users/${this.username}`,
      method: 'PATCH',
      data: patchDataObj,
      success: apiResponse => {
        this.retrieveDetails(() => cb(apiResponse)); // returns apiResponse to callback
      }
    });
  }

  // make an API request to remove a user
  remove(cb) {
    const deleteDataObj = {
      token: this.loginToken
    };

    $.ajax({
      url: `${API_BASE_URL}/users/${this.username}`,
      method: 'DELETE',
      data: deleteDataObj,
      success: apiResponse => cb(apiResponse) // returns apiResponse to callback
    });
  }
}

/* instance contains all story details including author, story id, url, and etc */
class Story {
  constructor(author, title, url, username, storyId) {
    this.author = author;
    this.title = title;
    this.url = url;
    this.username = username;
    this.storyId = storyId;
  }

  // make an API request to update a story
  update(user, storyData, cb) {
    let patchDataObj = { token: user.loginToken, story: storyData };

    $.ajax({
      url: `${API_BASE_URL}/stories/${this.storyId}`,
      method: 'PATCH',
      data: patchDataObj,
      success: apiResponse => user.retrieveDetails(() => cb(apiResponse))
      // returns apiResponse to callback
    });
  }
}

/* instance contains all Dom related display items and methods */
class DomView {
  constructor() {
    this.storyList = [];
    this.user = new User();
  }

  // calls getStories and displays most recent list of stories to DOM
  displayAllStories() {
    // delete all existing stories in parent container
    $('#stories').empty();

    StoryList.getStories(storyList => {
      this.storyList = storyList;

      // we have the stories, iterate over stories array and display each story
      this.storyList.stories.forEach(storyObj => {
        this.displaySingleStory(storyObj);
      });
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
      return storyObj.storyId === targetStoryId;
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
      return storyObj.storyId === targetStoryId;
    });
    // if targetStoryId is not found in favoriteStories, return false, otherwise true
    if (storyObjIndex === -1) {
      return false;
    }
    return true;
  }

  // submits login info from form to API
  loginUserSubmission() {
    event.preventDefault();
    const usernameInput = $('#username').val();
    const passwordInput = $('#password').val();

    this.user.username = usernameInput;
    this.user.password = passwordInput;

    // send API call to login, retrieve user details, get recent stories then
    //     render logged in state, displayAllStories
    this.user.login(() => {
      this.user.retrieveDetails(() => {
        StoryList.getStories(result => {
          this.storyList = result;
          this.checkForLoggedUser(() => {
            this.displayAllStories();
          });
        });
      });
    });
  }

  // make a request to API to log user out
  logUserOut() {
    // delete Local Storage
    localStorage.clear();
    // delete all Local User Data
    this.user = new User();
    // rerender full stories
    StoryList.getStories(result => {
      this.storyList = result;
      this.checkForLoggedUser(() => this.displayAllStories());
    });
  }

  // check if a user is currently logged in and then execute callback
  checkForLoggedUser(cb) {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');

    // If user token is found in LocalStorage
    if (token) {
      // Show Logged-in User Specific Links
      $('#submit').show();
      $('#favorites').show();

      // stories login info into User instance, retrieve user info from API and render DOM elements
      this.user.loginToken = token;
      this.user.username = username;
      this.user.retrieveDetails(result => {
        // Create DOM Elements in right side of nav-bar (Username/Profile Link & Logout)
        const displayName = result.name;
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
              .on('click', this.logUserOut.bind(this))
          );
        return cb();
      });
    } else {
      // User token does not exist. Create sign in on right side of nav bar

      // logic to hide user-required links on navbar
      $('#submit').hide();
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
              .on('click', this.loginUserSubmission.bind(this))
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
      return cb();
    }
  }

  // submits create user request to API
  submitCreateUser(event) {
    event.preventDefault();

    // grab values from create user forms
    const name = $('#create-displayname').val();
    const username = $('#create-username').val();
    const password = $('#create-password').val();

    // submit data to API for user creation
    User.create(username, password, name, user => {
      $('#createuser-form').slideUp();
      this.checkForLoggedUser(() => this.displayAllStories());
    });
  }

  // submits add new story request to API
  submitNewStory(event) {
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
    this.storyList.addStory(this.user, storyDataObj, apiResponse => {
      $('#new-form').slideToggle();
      this.user.retrieveDetails(user => {
        $('#title').val('');
        $('#url').val('');
        this.displayAllStories();
      });
    });
  }

  // submits create user profile modification request to API
  submitUpdateUserProfile() {
    // grab the values from the submit user changes form
    const name = $('#updateprofile-displayname').val();
    const password = $('#updateprofile-password').val();

    const patchDataObj = {
      name,
      password
    };

    // send api request, then hide user profile change form and update username in navbar
    this.user.update(patchDataObj, apiResponse => {
      $('#updateprofile-form').slideUp();
      $('#profile').text(name);
    });

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
  toggleStoryFavStatus(event) {
    // retrieve story id of parent li target = storyID
    const storyId = $(event.target)
      .closest('li')
      .attr('id');

    // logic for adding/remove story for userFavorites
    if (this.isStoryInUserFavorites(storyId)) {
      // story in currently in favorites, remove request via APi call
      this.user.removeFavorite(storyId, apiResponse => {
        // swaps rendering of star on click
        $(event.target).toggleClass('far fas');
        this.user.retrieveDetails(user => {
          return;
        });
      });
    } else {
      // story in currently not in favorites, add request via APi call
      this.user.addFavorite(storyId, apiResponse => {
        // swaps rendering of star on click
        $(event.target).toggleClass('far fas');
        this.user.retrieveDetails(user => {
          return;
        });
      });
    }

    // Optional TODO, you may want to rerender favorites page after toggles
    //   need to pull current text value of favorites link to determine which view to rerender
    //       displayfavorites or displayall
  }

  // submits delete story request to API
  submitDeleteStory(event) {
    event.preventDefault();
    // retrieve story id of parent li target = storyID
    const storyId = $(event.target)
      .closest('li')
      .attr('id');

    // make api call to delete a story, then rerender page w/ display all stories
    this.storyList.removeStory(this.user, storyId, () =>
      this.displayAllStories()
    );
  }

  // toggles display between favorite stories and all stories
  toggleDisplayFavStories() {
    const currentLinkText = $('#favorites').text();
    if (currentLinkText === 'favorites') {
      // display favorites and change link to all
      $('#favorites').text('all');
      this.displayFavoriteStories();
    } else if (currentLinkText === 'all') {
      // display all stories and change link to favorites
      $('#favorites').text('favorites');
      this.displayAllStories();
    }
  }

  // retrieve detials on selected story and push to modal
  retrieveStoryDetails(event) {
    // event.relatedTarget grabs button element in story container
    const storyId = $(event.relatedTarget)
      .closest('li')
      .attr('id');

    // obtain index in user ownStories with matching ID
    const targetStoryIdx = this.user.ownStories.findIndex(story => {
      return story.storyId === storyId;
    });

    const title = this.user.ownStories[targetStoryIdx].title;
    const url = this.user.ownStories[targetStoryIdx].url;
    $('#edit-title')
      .val(title)
      .attr('data-storyId', storyId);
    $('#edit-url').val(url);
  }

  // submit story modification to API
  submitStoryModification() {
    const storyId = $('#edit-title').attr('data-storyId');
    const updatedTitle = $('#edit-title').val();
    const updatedUrl = $('#edit-url').val();

    // hide Modal after submit
    $('#editStoryModal').modal('hide');

    // find story in ownStoriesIdx for AJAX Call
    const targetStoryIdx = this.user.ownStories.findIndex(story => {
      return story.storyId === storyId;
    });

    // modified story data obj for sending to API
    const storyData = {
      author: this.user.name,
      title: updatedTitle,
      url: updatedUrl
    };

    // initiate call api ajax call, then re-render all stories to reflect change
    this.user.ownStories[targetStoryIdx].update(this.user, storyData, () => {
      this.displayAllStories();
    });
  }

  // createEventListeners for static DOM elements
  createEventListeners() {
    /*------------------ Submit Events -------------------*/
    // event listener - submit user creation to API
    $('#createuser-form').on('submit', this.submitCreateUser.bind(this));

    // event listener - submit add story to API
    $('#new-form').on('submit', this.submitNewStory.bind(this));

    // event listener - submit update userprofile request to API
    $('#updateprofile-form').on(
      'submit',
      this.submitUpdateUserProfile.bind(this)
    );

    /*------------------ Click Events -------------------*/
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
      this.toggleStoryFavStatus.bind(this)
    );

    // event delegation - delete a story the user authored
    $('#stories').on(
      'click',
      '.delete--element',
      this.submitDeleteStory.bind(this)
    );

    // event listener - display all stories or just favorites depending on current link
    $('#favorites').on('click', this.toggleDisplayFavStories.bind(this));

    // event listener for modal popup
    $('#storyModal').on('show.bs.modal', this.retrieveStoryDetails.bind(this));

    // event listener for submitting story modification
    $('#update-story').on('click', this.submitStoryModification.bind(this));
  }
}

// Wait for DOM-Onload for jQuery
$(function() {
  /* cache jQuery static variables */
  // const $createuserform = $('#createuser-form');
  // add logic and check jQuery caching areas

  const domView = new DomView();
  // check for logged in user, then display all user stories
  domView.checkForLoggedUser(() => {
    domView.displayAllStories();
  });

  // run all event listeners in domView instance
  domView.createEventListeners();
});
