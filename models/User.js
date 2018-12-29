import { ajaxErrorOutput } from '../helpers/classHelpers.js';
import { API_BASE_URL } from '../app/config.js';
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
  static async create({ username, password, name, phone }) {
    const userDataObj = {
      user: {
        name,
        username,
        password
      }
    };

    // if phone exists, add to payload
    if (phone) {
      userDataObj.user.phone = phone;
    }

    const apiResponse = await $.ajax({
      url: `${API_BASE_URL}/signup`,
      method: 'POST',
      data: userDataObj,
      error: ajaxErrorOutput
    });

    return new User(
      apiResponse.user.username,
      apiResponse.user.name,
      apiResponse.token,
      apiResponse.user.favorites,
      apiResponse.user.stories
    );
  }

  // method for API request to log the user in and retrieves user token
  async login(password) {
    const loginDataObj = {
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

    await $.ajax({
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

  // make SMS recovery request to API
  static async sendRecoveryCode(username) {
    await $.ajax({
      url: `${API_BASE_URL}/users/${username}/recovery`,
      method: 'POST',
      error: ajaxErrorOutput
    });
  }

  // send sms recovery code, username, and new password to API
  static async resetPassword(code, username, password) {
    const patchDataObj = {
      user: {
        code,
        password
      }
    };

    let result;
    try {
      result = await $.ajax({
        url: `${API_BASE_URL}/users/${username}/recovery`,
        method: 'PATCH',
        data: patchDataObj
      });
    } catch (error) {
      result = error.responseJSON.error;
    }
    return result;
  }
}
