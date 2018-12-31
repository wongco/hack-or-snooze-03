import { ajaxErrorOutput } from '../helpers/classHelpers.js';
import { API_BASE_URL } from '../app/config.js';

/* instance contains all story details including author, story id, url, and etc */
export class Story {
  constructor(author, title, url, username, storyId) {
    this.author = author;
    this.title = title;
    this.url = url;
    this.username = username;
    this.storyId = storyId;
  }

  // make an API request to update a story
  async update(user, storyData) {
    const patchDataObj = { story: storyData };

    // demo request data - remove for production
    console.log(
      `Client - AJAX Target URL: ${API_BASE_URL}/stories/${this.storyId}`
    );
    console.log(
      `Client - HTTP Header - JSON Web Token: Authorization: Bearer ${user.loginToken.slice(
        0,
        20
      )}...`
    );
    console.log(`Client - AJAX Request JSON Body:`);
    console.log(patchDataObj);

    const apiResponse = await $.ajax({
      headers: { Authorization: `Bearer ${user.loginToken}` },
      url: `${API_BASE_URL}/stories/${this.storyId}`,
      method: 'PATCH',
      data: patchDataObj,
      error: ajaxErrorOutput
    });

    // demo response data - remove for production
    console.log(`Server - Hack-or-snooze API Response JSON Body:`);
    console.log(apiResponse);
  }
}
