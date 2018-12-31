import { ajaxErrorOutput } from '../helpers/classHelpers.js';
import { API_BASE_URL } from '../app/config.js';
import { Story } from './Story.js';

/* instances contain a recent list a stories with methods to download, add & remove*/
export class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  // downloads most recent 25 stories from api to local StoryList instance
  static async getStories() {
    const apiResponse = await $.ajax({
      url: `${API_BASE_URL}/stories`,
      method: 'GET',
      error: ajaxErrorOutput
    });

    const stories = apiResponse.stories.map(story => {
      const { author, title, url, username, storyId } = story;
      return new Story(author, title, url, username, storyId);
    });

    const storyList = new StoryList(stories);
    return storyList;
  }

  // method to initiate api call to add a new story
  async addStory(user, story) {
    const postDataObj = { story };

    // demo request data - remove for production
    console.log(`Client - AJAX Target URL: ${API_BASE_URL}/stories`);
    console.log(
      `Client - HTTP Header - JSON Web Token: Authorization: Bearer ${user.loginToken.slice(
        0,
        20
      )}...`
    );
    console.log(`Client - AJAX Request JSON Body:`);
    console.log(postDataObj);

    const apiResponse = await $.ajax({
      headers: { Authorization: `Bearer ${user.loginToken}` },
      url: `${API_BASE_URL}/stories`,
      method: 'POST',
      data: postDataObj,
      error: ajaxErrorOutput
    });

    // demo response data - remove for production
    console.log(`Server - Hack-or-snooze API Response JSON Body:`);
    console.log(apiResponse);
  }

  // method to initiate api call to remove a story, then syncs api user details with local user
  async removeStory(user, storyId) {
    // demo request data - remove for production
    console.log(`Client - AJAX Target URL: ${API_BASE_URL}/stories/${storyId}`);
    console.log(`Client - HTTP Header - JSON Web Token:`);
    console.log(`Authorization: Bearer ${user.loginToken.slice(0, 20)}...`);

    const apiResponse = await $.ajax({
      headers: { Authorization: `Bearer ${user.loginToken}` },
      url: `${API_BASE_URL}/stories/${storyId}`,
      method: 'DELETE',
      error: ajaxErrorOutput
    });

    // find index of story to remove from local instance of StoryList
    const storyIndex = this.stories.findIndex(
      story => story.storyId === +storyId
    );
    // removes story from local instance
    this.stories.splice(storyIndex, 1);

    // demo response data - remove for production
    console.log(`Server - Hack-or-snooze API Response JSON Body:`);
    console.log(apiResponse);
  }
}
