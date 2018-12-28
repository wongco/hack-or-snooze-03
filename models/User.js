import { ajaxErrorOutput, API_BASE_URL } from '../helpers/classHelpers.js';
import { Story } from './Story.js';

/* instance contains all User details including token, favorited and authored stories */
export class User {
  constructor(username, name, loginToken, favorites, ownStories) {
    this.username = username;
    this.name = name;
    this.loginToken = loginToken;
    this.favorites = favorites;
    this.ownStories = ownStories;
  }

  // static function that send a create new user request to API and returns new user
  static async create(username, password, name) {
    const userDataObj = {
      user: {
        name,
        username,
        password
      }
    };

    const apiResponse = await $.ajax({
      url: `${API_BASE_URL}/signup`,
      method: 'POST',
      data: userDataObj,
      error: ajaxErrorOutput
    });

    // items to save to localStorage to check for logged in user
    localStorage.setItem('token', apiResponse.token);
    localStorage.setItem('username', apiResponse.username);

    return new User(
      apiResponse.username,
      apiResponse.name,
      apiResponse.token,
      apiResponse.favorites,
      apiResponse.stories
    );
  }

  // method for API request to log the user in and retrieves user token
  async login(password) {
    let loginDataObj = {
      user: {
        username: this.username,
        password
      }
    };

    const apiResponse = await $.ajax({
      url: `${API_BASE_URL}/login`,
      method: 'POST',
      data: loginDataObj,
      error: ajaxErrorOutput
    });

    this.loginToken = apiResponse.token;

    // store items in local storage
    localStorage.setItem('token', apiResponse.token);
    localStorage.setItem('username', this.username);
  }

  // make a request to the API to get updated info about a single user incl favs and own stories
  async retrieveDetails() {
    const apiResponse = await $.ajax({
      headers: { Authorization: `Bearer ${this.loginToken}` },
      url: `${API_BASE_URL}/users/${this.username}`,
      method: 'GET',
      error: ajaxErrorOutput
    });

    this.name = apiResponse.user.name;
    this.favorites = apiResponse.user.favorites;
    this.ownStories = apiResponse.user.stories;

    // takes api response stories and maps them into Story instances
    this.ownStories = apiResponse.user.stories.map(story => {
      const { author, title, url, username, storyId } = story;
      return new Story(author, title, url, username, storyId);
    });
  }

  // make an API request to add a story to the user’s favorites
  async addFavorite(storyId) {
    await $.ajax({
      headers: { Authorization: `Bearer ${this.loginToken}` },
      url: `${API_BASE_URL}/users/${this.username}/favorites/${storyId}`,
      method: 'POST',
      error: ajaxErrorOutput
    });

    await this.retrieveDetails();
  }

  // make an API request to remove a story to the user’s favorites
  async removeFavorite(storyId) {
    await $.ajax({
      headers: { Authorization: `Bearer ${this.loginToken}` },
      url: `${API_BASE_URL}/users/${this.username}/favorites/${storyId}`,
      method: 'DELETE',
      error: ajaxErrorOutput
    });

    await this.retrieveDetails();
  }

  // make an API request to update a story
  async update(userData) {
    const patchDataObj = {
      user: userData
    };

    $.ajax({
      headers: { Authorization: `Bearer ${this.loginToken}` },
      url: `${API_BASE_URL}/users/${this.username}`,
      method: 'PATCH',
      data: patchDataObj,
      error: ajaxErrorOutput
    });

    await this.retrieveDetails();
  }

  // make an API request to remove a user
  async remove() {
    await $.ajax({
      headers: { Authorization: `Bearer ${this.loginToken}` },
      url: `${API_BASE_URL}/users/${this.username}`,
      method: 'DELETE',
      error: ajaxErrorOutput
    });
  }
}
